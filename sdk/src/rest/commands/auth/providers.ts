import type { RestCommand } from '../../types.js';

export interface ReadProviderOutput {
	name: string;
	driver: string;
	icon?: string | null;
}

/**
 * List all the configured auth providers.
 *
 * @returns Array of configured auth providers.
 */
export const readProviders =
	<Schema extends object>(sessionOnly = false): RestCommand<ReadProviderOutput[], Schema> =>
	() => ({
		path: sessionOnly ? '/auth?sessionOnly' : '/auth',
		method: 'GET',
	});
