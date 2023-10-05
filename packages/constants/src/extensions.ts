import { z } from 'zod';

export const APP_SHARED_DEPS = ['@directus/extensions-sdk', 'vue', 'vue-router', 'vue-i18n', 'pinia'];
export const API_SHARED_DEPS = ['directus'];

export const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module', 'panel'] as const;
export const API_EXTENSION_TYPES = ['hook', 'endpoint'] as const;
export const HYBRID_EXTENSION_TYPES = ['operation'] as const;
export const BUNDLE_EXTENSION_TYPES = ['bundle'] as const;
export const EXTENSION_TYPES = [
	...APP_EXTENSION_TYPES,
	...API_EXTENSION_TYPES,
	...HYBRID_EXTENSION_TYPES,
	...BUNDLE_EXTENSION_TYPES,
] as const;
export const NESTED_EXTENSION_TYPES = [
	...APP_EXTENSION_TYPES,
	...API_EXTENSION_TYPES,
	...HYBRID_EXTENSION_TYPES,
] as const;
export const APP_OR_HYBRID_EXTENSION_TYPES = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES] as const;
export const APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES = [
	...APP_OR_HYBRID_EXTENSION_TYPES,
	...BUNDLE_EXTENSION_TYPES,
] as const;

export const EXTENSION_LANGUAGES = ['javascript', 'typescript'] as const;

export const EXTENSION_NAME_REGEX = /^(?:(?:@[^/]+[/_])?directus-extension-|@directus\/extension-)(.+)$/;

export const EXTENSION_PKG_KEY = 'directus:extension';

// ---------- types for package.json ---------- //

export const SplitEntrypoint = z.object({
	app: z.string(),
	api: z.string(),
});

export const ExtensionOptionsBundleEntry = z.union([
	z.object({
		type: z.union([z.enum(APP_EXTENSION_TYPES), z.enum(API_EXTENSION_TYPES)]),
		name: z.string(),
		source: z.string(),
	}),
	z.object({
		type: z.enum(HYBRID_EXTENSION_TYPES),
		name: z.string(),
		source: SplitEntrypoint,
	}),
]);

export const ExtensionPermission = z.union([
	z.object({
		permission: z.literal('request'),
		optional: z.boolean().optional(),
		allowedUrls: z.array(z.string()).optional(),
	}),
	z.object({
		permission: z.enum(['create-items', 'read-items', 'update-items', 'delete-items']),
		optional: z.boolean().optional(),
		role: z.string().optional(),
	})
])

export const ExtensionOptionsBase = z.object({
	host: z.string(),
	secure: z.boolean().optional(),
	hidden: z.boolean().optional(),
	debugger: z.boolean().optional(),
	permissions: z.array(ExtensionPermission).optional(),
});

export const ExtensionOptionsAppOrApi = z.object({
	type: z.union([z.enum(APP_EXTENSION_TYPES), z.enum(API_EXTENSION_TYPES)]),
	path: z.string(),
	source: z.string(),
});

export const ExtensionOptionsHybrid = z.object({
	type: z.enum(HYBRID_EXTENSION_TYPES),
	path: SplitEntrypoint,
	source: SplitEntrypoint,
});

export const ExtensionOptionsBundle = z.object({
	type: z.literal('bundle'),
	path: SplitEntrypoint,
	entries: z.array(ExtensionOptionsBundleEntry),
});

export const ExtensionOptionsBundleEntries = z.array(ExtensionOptionsBundleEntry);

export const ExtensionOptions = ExtensionOptionsBase.and(
	z.union([ExtensionOptionsAppOrApi, ExtensionOptionsHybrid, ExtensionOptionsBundle])
);

export const ExtensionManifest = z.object({
	name: z.string(),
	version: z.string(),
	type: z.union([z.literal('module'), z.literal('commonjs')]).optional(),
	description: z.string().optional(),
	icon: z.string().optional(),
	logo: z.string().optional(),
	dependencies: z.record(z.string()).optional(),
	[EXTENSION_PKG_KEY]: ExtensionOptions,
});

// ---------- types for database extension ---------- //

export const DatabaseExtension = z.object({
	name: z.string(),
	enabled: z.boolean(),
	options: z.record(z.any()).nullable(),
	granted_permissions: z.array(ExtensionPermission).nullable(),
	registry: z.string().nullable(),
});

// ---------- types for parsed extension ---------- //

const ExtensionBase = z.object({
	path: z.string(),
	name: z.string(),
	description: z.string().optional(),
	icon: z.string().optional(),
	version: z.string().optional(),
	host: z.string().optional(),
	secure: z.boolean(),
	debugger: z.boolean().optional(),
	storage_location: z.string().optional(),
	apiExtensionPath: z.string().optional(),
	requested_permissions: z.array(ExtensionPermission).optional(),
});

export const AppExtension = ExtensionBase.extend({
	type: z.enum(APP_EXTENSION_TYPES),
	entrypoint: z.string(),
});

export const ApiExtension = ExtensionBase.extend({
	type: z.enum(API_EXTENSION_TYPES),
	entrypoint: z.string(),
});

export const HybridExtension = ExtensionBase.extend({
	type: z.enum(HYBRID_EXTENSION_TYPES),
	entrypoint: SplitEntrypoint,
});

export const BundleExtension = ExtensionBase.extend({
	type: z.literal('bundle'),
	entrypoint: SplitEntrypoint,
	entries: ExtensionOptionsBundleEntries,
});

export const Extension = z.union([AppExtension, ApiExtension, HybridExtension, BundleExtension]);

export const FullExtension = Extension.and(DatabaseExtension);

export const ExtensionInfo = DatabaseExtension.and(
	z.union([
		AppExtension.omit({ entrypoint: true, path: true }),
		ApiExtension.omit({ entrypoint: true, path: true }),
		HybridExtension.omit({ entrypoint: true, path: true }),
		BundleExtension.omit({ entrypoint: true, path: true }),
	])
);
