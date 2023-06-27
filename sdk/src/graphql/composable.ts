import type { DirectusClient } from '../client.js';
import type { RequestOptions } from '../types/request.js';
import type { GraphqlClient } from './types.js';
import { request } from '../utils/request.js';
import { getRequestUrl } from '../utils/get-request-url.js';

/**
 * Creates a client to communicate with Directus GraphQL.
 *
 * @returns A Directus GraphQL client.
 */
export const graphql = () => {
	return <Schema extends object>(client: DirectusClient<Schema>): GraphqlClient<Schema> => {
		return {
			async query<Output extends object = Record<string, any>>(
				query: string,
				variables?: Record<string, unknown>,
				scope: 'items' | 'system' = 'items'
			): Promise<Output> {
				const options: RequestOptions = {
					method: 'POST',
					path: scope === 'items' ? '/graphql' : '/graphql/system',
					body: JSON.stringify({ query, variables }),
					headers: {},
				};

				const token = await client.getToken();

				if (token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${token}`;
				}

				const requestUrl = getRequestUrl(client.url, options);

				return await request<Output>(requestUrl.toString(), options);
			},
		};
	};
};
