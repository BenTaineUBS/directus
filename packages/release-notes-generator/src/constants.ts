import { VersionType } from '@changesets/types';
import { LinkedPackage } from './types';

export const REPO = 'directus/directus';

export const MAIN_PACKAGE = 'directus';

/** Ensure the second package is bumped if the first one has been bumped */
export const LINKED_PACKAGES: LinkedPackage[] = [
	// Link '@directus/app' to 'directus' to reflect correct main version in app
	['directus', '@directus/app'],
];

export const UNTYPED_PACKAGES = {
	docs: '📝 Documentation',
	'tests-blackbox': '🧪 Blackbox Tests',
} as const satisfies Record<string, string>;

export const PACKAGE_ORDER = ['@directus/app', '@directus/api'];

export const TYPE_MAP = {
	major: '⚠️ Potential Breaking Changes',
	minor: '✨ New Features & Improvements',
	patch: '🐛 Bug Fixes & Optimizations',
	none: '📎 Misc.',
} as const satisfies Record<VersionType, string>;

export const NOTICE_TYPE = TYPE_MAP.major;

export const VERSIONS_TITLE = '📦 Published Versions';
