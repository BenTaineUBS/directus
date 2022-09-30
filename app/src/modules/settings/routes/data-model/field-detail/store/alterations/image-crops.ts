import { StateUpdates, State, HelperFunctions } from '../types';
import { set } from 'lodash';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('localType')) {
		removeSchema(updates);
		setTypeToAlias(updates);
		prepareRelation(updates, state);
		setDefaults(updates, state, helperFn);
	}

	if (hasChanged('field.field')) {
		updateRelationField(updates);
		autoGenerateJunctionCollectionName(updates, helperFn);

		// For the image crops, field name is going to be a field
		// linking the M2A collections back to the junction collection
		set(updates, 'relations.m2o.meta.one_allowed_collections_relation_field', updates.field?.field);
	}

	if (hasChanged('relations.o2m.field')) {
		setJunctionFields(updates, state, helperFn);
	}

	if (hasChanged('relations.m2o.field')) {
		setJunctionFields(updates, state, helperFn);
	}

	if (hasChanged('relations.o2m.collection') || hasChanged('relations.m2o.collection')) {
		matchJunctionCollectionName(updates);
	}

	if (hasChanged('fields.corresponding')) {
		setRelatedOneFieldForCorrespondingField(updates);
	}

	if (
		[
			'relations.o2m.collection',
			'relations.o2m.field',
			'relations.m2o.field',
			'relations.o2m.meta.sort_field',
			'relations.m2o.meta.one_collection_field',
		].some(hasChanged)
	) {
		generateCollections(updates, state, helperFn);
		generateFields(updates, state, helperFn);
	}
}

export function removeSchema(updates: StateUpdates) {
	set(updates, 'field.schema', undefined);
}

export function setTypeToAlias(updates: StateUpdates) {
	set(updates, 'field.type', 'alias');
}

export function prepareRelation(updates: StateUpdates, state: State) {
	if (!updates.relations) updates.relations = {};

	updates.relations.o2m = {
		collection: undefined,
		field: undefined,
		related_collection: 'directus_files',
		meta: {
			one_field: updates.field?.field ?? getAutomaticJunctionCollectionName(),
			sort_field: null,
			one_deselect_action: 'nullify',
		},
		schema: {
			on_delete: 'CASCADE',
		},
	};

	updates.relations.m2o = {
		collection: undefined,
		field: undefined,
		related_collection: null,
		meta: {
			one_field: null,
			sort_field: null,
			one_deselect_action: 'nullify',
		},
		schema: null,
	};
}

export function setDefaults(updates: StateUpdates, state: State, { getCurrent }: HelperFunctions) {
	const currentCollection = state.collection!;
	const junctionName = getAutomaticJunctionCollectionName();

	// Set relation from files to crops collection and setup an M2A
	set(updates, 'collection', 'directus_files');
	set(updates, 'field.meta.special', 'm2a');
	set(updates, 'field.meta.interface', 'file-image-crop');
	set(updates, 'relations.o2m.collection', junctionName);
	set(updates, 'relations.o2m.field', 'file_id');

	set(updates, 'relations.m2o.collection', junctionName);
	set(updates, 'relations.m2o.field', 'item');
	set(updates, 'relatedCollectionFields.m2o', [
		{
			collection: junctionName,
			field: 'filename_download',
			type: 'string',
		},
		{
			collection: junctionName,
			field: 'image_transformations',
			type: 'json',
		},
		{
			collection: junctionName,
			field: 'x',
			type: 'integer',
		},
		{
			collection: junctionName,
			field: 'y',
			type: 'integer',
		},
		{
			collection: junctionName,
			field: 'width',
			type: 'integer',
		},
		{
			collection: junctionName,
			field: 'height',
			type: 'integer',
		}
	]);
	set(updates, 'relations.m2o.meta.one_allowed_collections', [currentCollection]);
	set(updates, 'relations.m2o.meta.one_collection_field', 'collection');

	// Create a M2O relation between the collections and junction table
	set(updates, 'createFieldOnCurrentCollection', false);
	set(updates, 'relations.m2o.meta.link_one_allowed_collections_back', true);
	set(updates, 'relations.m2o.meta.one_allowed_collections_relation_field', junctionName);
}

export function autoGenerateJunctionCollectionName(updates: StateUpdates, { getCurrent }: HelperFunctions) {
	if (getCurrent('autoGenerateJunctionRelation') === false) return;

	set(updates, 'relations.o2m.collection', getAutomaticJunctionCollectionName());
}

export function getAutomaticJunctionCollectionName() {
	let name = `image_crops`;

	if (name.startsWith('directus_')) {
		name = 'junction_' + name;
	}

	return name;
}

export function updateRelationField(updates: StateUpdates) {
	if (!updates.field?.field) return;

	if (!updates.relations?.o2m) updates.relations = { o2m: {} };
	set(updates, 'relations.o2m.meta.one_field', updates.field.field);
}

export function preventCircularConstraint(updates: StateUpdates, _state: State, { getCurrent }: HelperFunctions) {
	if (getCurrent('relations.o2m.collection') === getCurrent('relations.o2m.related_collection')) {
		set(updates, 'relations.o2m.schema.on_delete', 'NO ACTION');
	}
}

export function setJunctionFields(updates: StateUpdates, _state: State, { getCurrent }: HelperFunctions) {
	set(updates, 'relations.o2m.meta.junction_field', getCurrent('relations.m2o.field'));
	set(updates, 'relations.m2o.meta.junction_field', getCurrent('relations.o2m.field'));
}

function collectionExists(collection: string) {
	return !!useCollectionsStore().getCollection(collection);
}

function fieldExists(collection: string, field: string) {
	return !!useFieldsStore().getField(collection, field);
}

export function generateCollections(updates: StateUpdates, state: State, { getCurrent }: HelperFunctions) {
	const junctionCollection = getCurrent('relations.o2m.collection');

	if (!junctionCollection || collectionExists(junctionCollection)) {
		set(updates, 'collections.junction', undefined);
	} else {
		set(updates, 'collections.junction', {
			collection: junctionCollection,
			meta: {
				hidden: true,
				icon: 'import_export',
			},
			schema: {
				name: junctionCollection,
			},
			fields: [
				{
					field: 'id',
					type: 'integer',
					schema: {
						has_auto_increment: true,
					},
					meta: {
						hidden: true,
					},
				},
			],
		});
	}
}

function generateFields(updates: StateUpdates, state: State, { getCurrent }: HelperFunctions) {
	const junctionCollection = getCurrent('relations.o2m.collection');
	const junctionCurrent = getCurrent('relations.o2m.field');
	const junctionRelated = getCurrent('relations.m2o.field');
	const oneCollectionField = getCurrent('relations.m2o.meta.one_collection_field');
	const sort = getCurrent('relations.o2m.meta.sort_field');

	if (junctionCollection && junctionCurrent && fieldExists(junctionCollection, junctionCurrent) === false) {
		set(updates, 'fields.junctionCurrent', {
			collection: junctionCollection,
			field: junctionCurrent,
			type: 'uuid',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.junctionCurrent', undefined);
	}

	if (junctionCollection && junctionRelated && fieldExists(junctionCollection, junctionRelated) === false) {
		set(updates, 'fields.junctionRelated', {
			collection: junctionCollection,
			field: junctionRelated,
			// We'll have to save the foreign key as a string, as that's the only way to safely
			// be able to store the PK of multiple typed collections
			type: 'string',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.junctionRelated', undefined);
	}

	if (junctionCollection && oneCollectionField && fieldExists(junctionCollection, oneCollectionField) === false) {
		set(updates, 'fields.oneCollectionField', {
			collection: junctionCollection,
			field: oneCollectionField,
			// directus_collections.collection is a string
			type: 'string',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.oneCollectionField', undefined);
	}

	if (junctionCollection && sort && fieldExists(junctionCollection, sort) === false) {
		set(updates, 'fields.sort', {
			collection: junctionCollection,
			field: sort,
			type: 'uuid',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.sort', undefined);
	}
}

export function matchJunctionCollectionName(updates: StateUpdates) {
	if (updates?.relations?.o2m?.collection && updates.relations.o2m.collection !== updates.relations.m2o?.collection) {
		set(updates, 'relations.m2o.collection', updates.relations.o2m.collection);
	}

	if (updates?.relations?.m2o?.collection && updates.relations.m2o.collection !== updates.relations.o2m?.collection) {
		set(updates, 'relations.o2m.collection', updates.relations.m2o.collection);
	}
}

export function setRelatedOneFieldForCorrespondingField(updates: StateUpdates) {
	if (updates?.fields?.corresponding?.field) {
		set(updates, 'relations.m2o.meta.one_field', updates.fields.corresponding.field);
	}

	if (!updates.fields?.corresponding) {
		set(updates, 'relations.m2o.meta.one_field', null);
	}
}
