import { EXTENSION_TYPES } from '@directus/extensions';
import { z } from 'zod';

export const RegistryListResponse = z.array(
	z.object({
		id: z.string(),
		name: z.string(),
		description: z.union([z.null(), z.string()]),
		downloads: z.number(),
		verified: z.boolean(),
		versions: z.array(
			z.object({
				version: z.string(),
				publish_date: z.string(),
				verified: z.boolean(),
				type: z.enum(EXTENSION_TYPES),
				publisher: z.object({
					username: z.string(),
					verified: z.boolean(),
				}),
			}),
		),
	}),
);
