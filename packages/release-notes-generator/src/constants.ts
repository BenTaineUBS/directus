import { VersionType } from '@changesets/types';

export const REPO = 'directus/directus';

export const MAIN_PACKAGE = 'directus';

export const FILTERED_PACKAGES = ['directus'];

export const UNTYPED_PACKAGES: Record<string, string> = {
	docs: '📝 Documentation',
	'tests-blackbox': '🧪 Blackbox Tests',
};

export const PACKAGE_ORDER = ['@directus/app', '@directus/api'];

export const TYPE_MAP = {
	major: '⚠️ Potential Breaking Changes',
	minor: '✨ New Features & Improvements',
	patch: '🐛 Bug Fixes & Optimizations',
	none: '📎 Misc.',
} as const satisfies Record<VersionType, string>;

export const VERSIONS_TITLE = '📦 Published Versions';
