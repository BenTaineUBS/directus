import type { Field, Relation, SchemaOverview } from '@directus/types';
import type { Diff, DiffNew } from 'deep-diff';
import deepDiff from 'deep-diff';
import type { Knex } from 'knex';
import { cloneDeep, merge, set } from 'lodash-es';
import type { Logger } from 'pino';
import { flushCaches } from '../cache.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import logger from '../logger.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import type {
	AbstractServiceOptions,
	ActionEventParams,
	Collection,
	MutationOptions,
	Snapshot,
	SnapshotDiff,
	SnapshotField,
} from '../types/index.js';
import { DiffKind } from '../types/index.js';
import { getSchema } from './get-schema.js';

type CollectionDelta = {
	collection: string;
	diff: Diff<Collection | undefined>[];
};

export type createCollectionsParams = {
	snapshotDiff: SnapshotDiff;
	mutationOptions: MutationOptions;
	collections: CollectionDelta[];
	collectionsService: CollectionsService;
	logger: Logger;
};

async function createCollections({
	snapshotDiff,
	mutationOptions,
	collections,
	collectionsService,
	logger,
}: createCollectionsParams) {
	for (const { collection, diff } of collections) {
		// Sanity check
		if (diff?.[0]?.kind !== DiffKind.NEW || !diff?.[0].rhs) {
			continue;
		}

		// We'll nest the to-be-created fields in the same collection creation, to prevent
		// creating a collection without a primary key
		const fields = snapshotDiff.fields
			.filter((fieldDiff) => fieldDiff.collection === collection)
			.map((fieldDiff) => (fieldDiff.diff[0] as DiffNew<Field>).rhs) // TODO type errors?
			.map((fieldDiff) => {
				// Casts field type to UUID when applying non-PostgreSQL schema onto PostgreSQL database.
				// This is needed because they snapshots UUID fields as char/varchar with length 36.
				if (
					['char', 'varchar'].includes(String(fieldDiff.schema?.data_type).toLowerCase()) &&
					fieldDiff.schema?.max_length === 36 &&
					(fieldDiff.schema?.is_primary_key ||
						(fieldDiff.schema?.foreign_key_table && fieldDiff.schema?.foreign_key_column))
				) {
					return merge(fieldDiff, { type: 'uuid', schema: { data_type: 'uuid', max_length: null } });
				} else {
					return fieldDiff;
				}
			});

		try {
			await collectionsService.createOne({ ...diff[0].rhs, fields }, mutationOptions);
			logger.info(`Added collection "${collection}" to transaction`);
		} catch (err: any) {
			logger.error(`Failed to create collection "${collection}"`);
			throw err;
		}

		// Now that the fields are in for this collection, we can strip them from the field edits
		snapshotDiff.fields = snapshotDiff.fields.filter((fieldDiff) => fieldDiff.collection !== collection);

		const nestedCollectionsToCreate = snapshotDiff.collections.filter(
			({ diff }) => (diff[0] as DiffNew<Collection>).rhs?.meta?.group === collection
		) as CollectionDelta[];

		await createCollections({
			snapshotDiff,
			mutationOptions,
			collections: nestedCollectionsToCreate,
			collectionsService,
			logger,
		});
	}
}

export async function applyDiff(
	currentSnapshot: Snapshot,
	snapshotDiff: SnapshotDiff,
	options?: { database?: Knex; schema?: SchemaOverview }
): Promise<void> {
	const database = options?.database ?? getDatabase();
	const helpers = getHelpers(database);

	const nestedActionEvents: ActionEventParams[] = [];

	const mutationOptions: MutationOptions = {
		autoPurgeCache: false,
		autoPurgeSystemCache: false,
		bypassEmitAction: (params) => nestedActionEvents.push(params),
		emitEvents: true,
		bypassLimits: true,
	};

	const runPostColumnChange = await helpers.schema.preColumnChange();

	await database.transaction(async (knex) => {
		const schema = await getSchema({ database: knex, bypassCache: true });
		const serviceOptions: AbstractServiceOptions = { knex, schema };
		const collectionsService = new CollectionsService(serviceOptions);
		const fieldsService = new FieldsService(serviceOptions);
		const relationsService = new RelationsService(serviceOptions);

		// Finds all collections that need to be created
		const newCollections = snapshotDiff.collections.filter(({ diff }: CollectionDelta) => {
			// Check new collections only
			const isNewCollection = diff[0]?.kind === DiffKind.NEW;
			if (!isNewCollection) return false;

			// Create now if no group
			const groupName = (diff[0] as DiffNew<Collection>).rhs.meta?.group;
			if (!groupName) return true;

			// Check if parent collection already exists in schema
			const parentExists = currentSnapshot.collections.find((c) => c.collection === groupName) !== undefined;

			// If this is a new collection and the parent collection doesn't exist in current schema ->
			// Check if the parent collection will be created as part of applying this snapshot ->
			// If yes -> this collection will be created recursively
			// If not -> create now
			// (ex.)
			// TopLevelCollection - I exist in current schema
			// 		NestedCollection - I exist in snapshotDiff as a new collection
			//			TheCurrentCollectionInIteration - I exist in snapshotDiff as a new collection but will be created as part of NestedCollection
			const parentWillBeCreatedInThisApply =
				snapshotDiff.collections.filter(
					({ collection, diff }) => diff[0]?.kind === DiffKind.NEW && collection === groupName
				).length > 0;

			// Has group, but parent is not new, parent is also not being created in this snapshot apply
			if (parentExists && !parentWillBeCreatedInThisApply) return true;

			return false;
		});
		// Create top level collections (no group, or highest level in existing group) first,
		// then continue with nested collections recursively
		await createCollections({
			snapshotDiff,
			mutationOptions,
			collections: newCollections,
			collectionsService,
			logger,
		});

		// // // Deletion of relations

		const toDeleteCollections = snapshotDiff.collections.filter(({ diff }) => {
			if (diff.length === 0 || diff[0] === undefined) return false;
			return diff[0].kind === DiffKind.DELETE;
		});
		const toDeleteCollectionKeys = toDeleteCollections.map((delta) => delta.collection);
		logger.info(`${toDeleteCollections.length} collections will be prepared for deletion`);

		// The deletion of collections might not work due to constraints on relations
		// We need to delete them first, before we can delete the collections

		const relationsPerCollection: Array<Array<Relation>> = [];
		for (const diff of toDeleteCollections) {
			const relations = schema.relations.filter(
				(r) => r.related_collection === diff.collection || r.collection === diff.collection
			);
			if (relations.length === 0) {
				continue;
			}
			relationsPerCollection.push(relations);
		}
		logger.info(`${relationsPerCollection.length} collections have relations that will be marked for deletion first`);

		for (const relations of relationsPerCollection) {
			for (const relation of relations) {
				await relationsService.deleteOne(relation.collection, relation.field, mutationOptions);
				logger.info(`  - '${relation.collection}.${relation.field}' prepared for deletion`);
			}
		}

		// Deletions dont get propagated to the schema, since the transaction isnt run yet
		// This can lead to errors when trying to delete fields, because the service
		// deletes relational fields too - This results in duplicate deletions i.e.
		// we need to get rid of those manually, to avoid duplicate deletions
		schema.relations = schema.relations.filter((r) => {
			return (
				toDeleteCollectionKeys.includes(r.collection) === false &&
				toDeleteCollectionKeys.includes(r.related_collection!) === false
			);
		});

		// // // Deletion of collections

		for (const collectionKey of toDeleteCollectionKeys) {
			await collectionsService.deleteOne(collectionKey, mutationOptions);
			logger.info(`Collection '${collectionKey}' prepared for deletion`);
		}

		// // // Updating collections

		for (const { collection, diff } of snapshotDiff.collections) {
			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY) {
				const currentCollection = currentSnapshot.collections.find((field) => {
					return field.collection === collection;
				});

				if (currentCollection) {
					try {
						const newValues = diff.reduce((acc, currentDiff) => {
							deepDiff.applyChange(acc, undefined, currentDiff);
							return acc;
						}, cloneDeep(currentCollection));

						await collectionsService.updateOne(collection, newValues, mutationOptions);
					} catch (err) {
						logger.error(`Failed to update collection "${collection}"`);
						throw err;
					}
				}
			}
		}

		for (const { collection, field, diff } of snapshotDiff.fields) {
			if (diff?.[0]?.kind === DiffKind.NEW && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.createField(collection, (diff[0] as DiffNew<Field>).rhs, undefined, mutationOptions);
				} catch (err) {
					logger.error(`Failed to create field "${collection}.${field}"`);
					throw err;
				}
			}

			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY || isNestedMetaUpdate(diff[0]!)) {
				const currentField = currentSnapshot.fields.find((snapshotField) => {
					return snapshotField.collection === collection && snapshotField.field === field;
				});

				if (currentField) {
					try {
						const newValues = diff.reduce((acc, currentDiff) => {
							deepDiff.applyChange(acc, undefined, currentDiff);
							return acc;
						}, cloneDeep(currentField));

						await fieldsService.updateField(collection, newValues, mutationOptions);
					} catch (err) {
						logger.error(`Failed to update field "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0]?.kind === DiffKind.DELETE && !isNestedMetaUpdate(diff?.[0])) {
				try {
					await fieldsService.deleteField(collection, field, mutationOptions);
				} catch (err) {
					logger.error(`Failed to delete field "${collection}.${field}"`);
					throw err;
				}

				// Field deletion also cleans up the relationship. We should ignore any relationship
				// changes attached to this now non-existing field
				snapshotDiff.relations = snapshotDiff.relations.filter(
					(relation) => (relation.collection === collection && relation.field === field) === false
				);
			}
		}

		for (const { collection, field, diff } of snapshotDiff.relations) {
			const structure = {};

			for (const diffEdit of diff) {
				set(structure, diffEdit.path!, undefined);
			}

			if (diff?.[0]?.kind === DiffKind.NEW) {
				try {
					await relationsService.createOne(
						{
							...(diff[0] as DiffNew<Relation>).rhs,
							collection,
							field,
						},
						mutationOptions
					);
				} catch (err) {
					logger.error(`Failed to create relation "${collection}.${field}"`);
					throw err;
				}
			}

			if (diff?.[0]?.kind === DiffKind.EDIT || diff?.[0]?.kind === DiffKind.ARRAY) {
				const currentRelation = currentSnapshot.relations.find((relation) => {
					return relation.collection === collection && relation.field === field;
				});

				if (currentRelation) {
					try {
						const newValues = diff.reduce((acc, currentDiff) => {
							deepDiff.applyChange(acc, undefined, currentDiff);
							return acc;
						}, cloneDeep(currentRelation));

						await relationsService.updateOne(collection, field, newValues, mutationOptions);
					} catch (err) {
						logger.error(`Failed to update relation "${collection}.${field}"`);
						throw err;
					}
				}
			}

			if (diff?.[0]?.kind === DiffKind.DELETE) {
				try {
					await relationsService.deleteOne(collection, field, mutationOptions);
				} catch (err) {
					logger.error(`Failed to delete relation "${collection}.${field}"`);
					throw err;
				}
			}
		}
	});
	logger.info(`Transaction successfully applied`);

	if (runPostColumnChange) {
		await helpers.schema.postColumnChange();
	}

	await flushCaches();

	if (nestedActionEvents.length > 0) {
		const updatedSchema = await getSchema({ database, bypassCache: true });

		for (const nestedActionEvent of nestedActionEvents) {
			nestedActionEvent.context.schema = updatedSchema;
			emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
		}
	}
}

export function isNestedMetaUpdate(diff: Diff<SnapshotField | undefined>): boolean {
	if (!diff) return false;
	if (diff.kind !== DiffKind.NEW && diff.kind !== DiffKind.DELETE) return false;
	if (!diff.path || diff.path.length < 2 || diff.path[0] !== 'meta') return false;
	return true;
}
