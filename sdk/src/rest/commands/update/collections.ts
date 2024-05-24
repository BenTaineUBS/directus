import type { DirectusCollection } from '../../../schema/collection.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type UpdateCollectionOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusCollection<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update the metadata for an existing collection.
 * @param collection
 * @param item
 * @param query
 * @returns The collection object for the updated collection in this request.
 * @throws Will throw if collection is empty
 */
export const updateCollection =
	<Schema, const TQuery extends Query<Schema, DirectusCollection<Schema>>>(
		collection: DirectusCollection<Schema>['collection'],
		item: NestedPartial<DirectusCollection<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateCollectionOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(collection, 'Collection cannot be empty');

		return {
			path: `/collections/${collection}`,
			params: query ?? {},
			body: JSON.stringify(item),
			method: 'PATCH',
		};
	};

/**
 * Update multiple collections as batch.
 * @param collections
 * @param query
 * @returns The collection object for the updated collection in this request.
 * @throws Will throw if no items are provided
 */
export const updateCollectionsBatch =
	<Schema, const TQuery extends Query<Schema, DirectusCollection<Schema>>>(
		collections: NestedPartial<DirectusCollection<Schema>>[],
		query?: TQuery,
	): RestCommand<UpdateCollectionOutput<Schema, TQuery>, Schema> =>
	() => {
		throwIfEmpty(collections, 'Collections cannot be empty');

		return {
			path: `/collections`,
			params: query ?? {},
			body: JSON.stringify(collections),
			method: 'PATCH',
		};
	};
