import type { PrimaryKey } from '@directus/types';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type UpdateItemsOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, Schema[Collection], TQuery['fields']>[];

/**
 * Update multiple items at the same time.
 *
 * @param collection The collection of the items
 * @param keys The primary key of the items
 * @param item The item data to update
 * @param query Optional return data query
 *
 * @returns Returns the item objects for the updated items.
 */
export const updatedItems =
	<
		Schema extends object,
		Collection extends keyof Schema,
		TQuery extends Query<Schema, Schema[Collection]>,
		Item = Schema[Collection]
	>(
		collection: Collection,
		keys: PrimaryKey[],
		item: Partial<Item>,
		query?: TQuery
	): RestCommand<UpdateItemsOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		const _collection = String(collection);

		return {
			path: `/items/${_collection}`,
			params: queryToParams(query ?? {}),
			body: JSON.stringify({ keys, data: item }),
			method: 'PATCH',
		};
	};
