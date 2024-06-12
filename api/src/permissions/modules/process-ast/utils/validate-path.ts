import { ForbiddenError } from '@directus/errors';
import type { Permission, SchemaOverview } from '@directus/types';

export function validatePath(
	path: string,
	permissions: Permission[],
	collection: string,
	fields: Set<string>,
	schema: SchemaOverview,
) {
	const pathSuffix = path === '' ? 'root' : `"${path}"`;

	const permissionsForCollection = permissions.filter((permission) => permission.collection === collection);
	const collectionInfo = schema.collections[collection];

	if (collectionInfo === undefined || permissionsForCollection.length === 0) {
		throw new ForbiddenError({
			reason: `You don't have permission to access collection "${collection}" or it does not exist. Queried in ${pathSuffix}.`,
		});
	}

	// Set of all fields that are allowed to be queried combined
	const allowedFields: Set<string> = new Set();

	for (const { fields } of permissionsForCollection) {
		if (!fields) {
			continue;
		}

		for (const field of fields) {
			allowedFields.add(field);

			if (field === '*') {
				break;
			}
		}
	}

	const requestedFields = Array.from(fields);
	const nonExistentFields = requestedFields.filter((field) => collectionInfo.fields[field] === undefined);

	const forbiddenFields = allowedFields.has('*')
		? []
		: requestedFields.filter((field) => allowedFields.has(field) === false);

	if (forbiddenFields.length > 0 || nonExistentFields.length > 0) {
		const fieldStr = [...forbiddenFields, ...nonExistentFields].map((field) => `"${field}"`).join(', ');

		throw new ForbiddenError({
			reason:
				forbiddenFields.length === 1
					? `You don't have permission to access field ${fieldStr} in collection "${collection}" or it does not exist. Queried in ${pathSuffix}.`
					: `You don't have permission to access fields ${fieldStr} in collection "${collection}" or they do not exist. Queried in ${pathSuffix}.`,
		});
	}
}
