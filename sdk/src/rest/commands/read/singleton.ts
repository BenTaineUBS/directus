import type { ApplyQueryFields, CollectionType, Query, SingletonCollections } from '../../../types/index.js';
import { throwIfCoreCollection } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export type ReadSingletonOutput<
	Schema extends object,
	Collection extends SingletonCollections<Schema>,
	TQuery extends Query<Schema, Schema[Collection]>
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * List the singleton item in Directus.
 *
 * @param collection The collection of the items
 * @param query The query parameters
 *
 * @returns An array of up to limit item objects. If no items are available, data will be an empty array.
 */
export const readSingleton =
	<
		Schema extends object,
		Collection extends SingletonCollections<Schema>,
		const TQuery extends Query<Schema, Schema[Collection]>
	>(
		collection: Collection,
		query?: TQuery
	): RestCommand<ReadSingletonOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		throwIfCoreCollection(collection, 'Cannot use readSingleton for core collections');

		return {
			path: `/items/${collection as string}`,
			params: query ?? {},
			method: 'GET',
		};
	};
