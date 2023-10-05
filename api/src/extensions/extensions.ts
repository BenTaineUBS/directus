import { APP_EXTENSION_TYPES, ExtensionInfo } from '@directus/constants';
import type { Extension, ExtensionInfo as ExtensionInfoType, FullExtension } from '@directus/types';
import { getPackageExtensions, getStorageExtensions } from '@directus/utils/node';
import type { Router } from 'express';
import getDatabase from '../database/index.js';
import { Emitter } from '../emitter.js';
import env from '../env.js';
import logger from '../logger.js';
import { getSchema } from '../utils/get-schema.js';
import { clone } from 'lodash-es';
import { JobQueue } from '../utils/job-queue.js';
import { ExtensionsService } from './service.js';
import { RegistrationManager } from './registration.js';
import { InstallationManager } from './installation.js';
import { WatcherManager } from './watcher.js';
import { VmManager } from './vm.js';
import path from 'path';
import { getStorage } from '../storage/index.js';

let extensionManager: ExtensionManager;

export async function getExtensionManager(): Promise<ExtensionManager> {
	if (!extensionManager) extensionManager = new ExtensionManager();

	return extensionManager;
}

type AppExtensions = string | null;

type Options = {
	schedule: boolean;
	watch: boolean;
};

const defaultOptions: Options = {
	schedule: true,
	watch: env['EXTENSIONS_AUTO_RELOAD'] && env['NODE_ENV'] !== 'development',
};

export class ExtensionManager {
	private isLoaded = false;
	public options: Options;

	private extensions: FullExtension[] = [];

	private appExtensions: AppExtensions = null;

	public apiEmitter: Emitter;

	public hookEmbedsHead: string[] = [];
	public hookEmbedsBody: string[] = [];

	private reloadQueue: JobQueue;

	public registration: RegistrationManager;
	public installation: InstallationManager | null = null;
	public watcher: WatcherManager;
	public vm: VmManager;

	constructor() {
		this.options = defaultOptions;
		this.apiEmitter = new Emitter();
		this.reloadQueue = new JobQueue();

		this.registration = new RegistrationManager(this);

		if (env['EXTENSIONS_AUTO_INSTALL'] === true) {
			this.installation = new InstallationManager(this);
		}

		this.watcher = new WatcherManager(this);
		this.vm = new VmManager(this);
	}

	public async initialize(options: Partial<Options> = {}): Promise<void> {
		this.options = {
			...defaultOptions,
			...options,
		};

		if (this.options.watch && !this.watcher.isWatcherInitialized()) {
			this.watcher.initializeWatcher();
		} else if (!this.options.watch && this.watcher.isWatcherInitialized()) {
			await this.watcher.closeWatcher();
		}

		if (!this.isLoaded) {
			await this.load();

			if (this.extensions.length > 0) {
				logger.info(
					`Enabled extensions: ${this.extensions
						.filter((ext) => ext.enabled)
						.map((ext) => ext.name)
						.join(', ')}`
				);

				logger.info(
					`Disabled extensions: ${this.extensions
						.filter((ext) => ext.enabled === false)
						.map((ext) => ext.name)
						.join(', ')}`
				);
			}
		}

		if (this.options.watch && !this.watcher.isWatcherInitialized()) {
			this.watcher.updateWatchedExtensions(this.extensions);
		}
	}

	public async reload(): Promise<void> {
		return new Promise((resolve) => {
			this.reloadQueue.enqueue(async () => {
				if (this.isLoaded) {
					logger.info('Reloading extensions');

					const prevExtensions = clone(this.extensions);

					await this.unload();
					await this.load();

					const added = this.extensions.filter(
						(extension) => !prevExtensions.some((prevExtension) => extension.path === prevExtension.path)
					);

					const removed = prevExtensions.filter(
						(prevExtension) => !this.extensions.some((extension) => prevExtension.path === extension.path)
					);

					this.watcher.updateWatchedExtensions(added, removed);

					const addedExtensions = added.map((extension) => extension.name);
					const removedExtensions = removed.map((extension) => extension.name);

					if (addedExtensions.length > 0) {
						logger.info(`Added extensions: ${addedExtensions.join(', ')}`);
					}

					if (removedExtensions.length > 0) {
						logger.info(`Removed extensions: ${removedExtensions.join(', ')}`);
					}
				} else {
					logger.warn('Extensions have to be loaded before they can be reloaded');
				}

				resolve();
			});
		});
	}

	public getDisplayExtensions(): ExtensionInfoType[] {
		return this.extensions.map((extension) => ExtensionInfo.parse(extension));
	}

	public getDisplayExtension(name: string | undefined): ExtensionInfoType | undefined {
		const extension = this.extensions.find((extension) => extension.name === name);

		if (!extension) {
			return undefined;
		}

		return ExtensionInfo.parse(extension);
	}

	public getExtensionsList(type?: string) {
		return this.extensions
			.filter((extension) => type === undefined || extension.type === type)
			.map((extension) => extension.name);
	}

	public getExtension(name: string) {
		return this.extensions.find((extension) => extension.name === name);
	}

	public getAppExtensions(): string | null {
		return this.appExtensions;
	}

	public getEndpointRouter(): Router {
		return this.registration.endpointRouter;
	}

	public getEmbeds() {
		return {
			head: wrapEmbeds('Custom Embed Head', this.hookEmbedsHead),
			body: wrapEmbeds('Custom Embed Body', this.hookEmbedsBody),
		};

		function wrapEmbeds(label: string, content: string[]): string {
			if (content.length === 0) return '';
			return `<!-- Start ${label} -->\n${content.join('\n')}\n<!-- End ${label} -->`;
		}
	}

	private async load(): Promise<void> {
		try {
			this.extensions = await this.getExtensions();
		} catch (err: any) {
			logger.warn(`Couldn't load extensions`);
			logger.warn(err);
		}

		await this.registration.registerHooks();
		await this.registration.registerEndpoints();
		await this.registration.registerOperations();
		await this.registration.registerBundles();

		if (env['SERVE_APP']) {
			this.appExtensions = await this.registration.generateExtensionBundle();
		}

		this.isLoaded = true;
	}

	private async unload(): Promise<void> {
		await this.registration.unregisterApiExtensions();

		this.apiEmitter.offAll();

		if (env['SERVE_APP']) {
			this.appExtensions = null;
		}

		this.isLoaded = false;
	}

	private async getExtensions(): Promise<FullExtension[]> {
		let extensions: Extension[] = []

		const packageExtensions = await getPackageExtensions(env['PACKAGE_FILE_LOCATION'])
		extensions.push(...packageExtensions)

		for (const location of Array.from<string>(env['EXTENSIONS_STORAGE_LOCATIONS'])) {

			const storage = await getStorage()
			const storageDriver = storage.location(location)

			const loadedExtensions = await getStorageExtensions(env['EXTENSIONS_PATH'], storageDriver, location)

			extensions.push(...loadedExtensions)
		}

		extensions = extensions.filter(
			(extension) => env['SERVE_APP'] || APP_EXTENSION_TYPES.includes(extension.type as any) === false
		);

		return this.loadExtensionPermissions(extensions);
	}

	public async reloadExtensionPermissions(): Promise<void> {
		this.extensions = await this.loadExtensionPermissions(this.extensions);
	}

	private async loadExtensionPermissions(extensions: Extension[]): Promise<FullExtension[]> {
		const extensionsService = new ExtensionsService({ knex: getDatabase(), schema: await getSchema() });

		const registeredExtensions = await extensionsService.readByQuery({
			limit: -1,
			fields: ['*'],
		});

		for (const extension of extensions) {
			const isInDB =
				registeredExtensions.find((registeredExtension) => registeredExtension.name === extension.name) !== undefined;

			if (!isInDB) {
				logger.info(`Registering extension ${extension.name} in the database`);

				await extensionsService.createOne({
					name: extension.name,
					enabled: true,
					options: {},
					granted_permissions: [],
				});

				registeredExtensions.push({
					name: extension.name,
					enabled: true,
					options: {},
					granted_permissions: [],
					registry: '',
				});
			}
		}

		return extensions.map((extension) => {
			const registeredExtension = registeredExtensions.find(
				(registeredExtension) => registeredExtension.name === extension.name
			);

			if (!registeredExtension) throw new Error(`Extension ${extension.name} is not registered in the database`);

			const apiEntrypoint = typeof extension.entrypoint === 'string' ? extension.entrypoint : extension.entrypoint.api
			const apiExtensionPath = extension.storage_location ? path.join(extension.path, apiEntrypoint) : path.resolve(extension.path, apiEntrypoint)

			return { ...extension, ...registeredExtension, apiExtensionPath };
		});
	}

	public getEnabledExtensions(): FullExtension[] {
		return this.extensions.filter((extension) => extension.enabled);
	}
}
