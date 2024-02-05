import { Ref } from 'vue';
import { isRevisionsAllowed } from './lib/is-revisions-allowed';
import { isSortAllowed } from './lib/is-sort-allowed';
import { Collection } from '../types';
import { isActionAllowed } from './lib/is-action-allowed';
import { isArchiveAllowed } from '../lib/is-archive-allowed';

export type UsableCollectionPermissions = {
	readAllowed: Ref<boolean>;
	createAllowed: Ref<boolean>;
	updateAllowed: Ref<boolean>;
	deleteAllowed: Ref<boolean>;
	sortAllowed: Ref<boolean>;
	archiveAllowed: Ref<boolean>;
	revisionsAllowed: Ref<boolean>;
};

/** Permissions on collection level */
export function useCollectionPermissions(collection: Collection): UsableCollectionPermissions {
	const readAllowed = isActionAllowed(collection, 'read');
	const createAllowed = isActionAllowed(collection, 'create');
	const updateAllowed = isActionAllowed(collection, 'update');
	const deleteAllowed = isActionAllowed(collection, 'delete');

	const sortAllowed = isSortAllowed(collection);
	const archiveAllowed = isArchiveAllowed(collection, updateAllowed);
	const revisionsAllowed = isRevisionsAllowed();

	return {
		readAllowed,
		createAllowed,
		updateAllowed,
		deleteAllowed,
		sortAllowed,
		archiveAllowed,
		revisionsAllowed,
	};
}
