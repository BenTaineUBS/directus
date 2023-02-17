import { createClient, RedisClientType } from 'redis';
import env from '../../env';
import logger from '../../logger';
import { getConfigFromEnv } from '../../utils/get-config-from-env';
import { CacheOptions, CacheService } from './cache';
import { parse, stringify } from 'json-buffer';
import { compress, decompress } from '../../utils/compress';
import { map } from 'async';
import { merge } from 'lodash';

export class RedisCache extends CacheService {
	client: RedisClientType;

	constructor(options: CacheOptions) {
		super(options);

		this.client = createClient(this.getConfig());
		this.client.on('error', (err) => logger.warn(err, `[cache] ${err}`));
		this.client.connect();
	}

	private getConfig() {
		if ('CACHE_REDIS' in env) return { url: env.CACHE_REDIS };
		const config = merge({}, getConfigFromEnv('REDIS_'), getConfigFromEnv('CACHE_REDIS_'));
		return {
			socket: {
				host: config.host,
				port: config.port,
			},
			username: config?.username,
			password: config?.password,
			database: config?.db,
		};
	}

	async get(key: string): Promise<any | null> {
		const value = await this.client.get(this.addPrefix(key));

		if (value === null) return null;

		return await decompress(parse(value));
	}
	async keys(pattern?: string | undefined): Promise<string[]> {
		const keys: string[] = [];

		for await (const key of this.client.scanIterator({ MATCH: this.addPrefix(pattern || '*') })) {
			keys.push(key);
		}

		return keys;
	}
	async set(key: string, value: any, ttl: number | undefined = this.ttl): Promise<void> {
		if (await this.isLocked()) return;

		const _key = this.addPrefix(key);

		await this.client.set(_key, stringify(await compress(value)));
		if (ttl !== undefined) await this.client.expire(_key, ttl);
	}
	async clear(): Promise<void> {
		await this.client.flushAll();
	}
	async delete(key: string): Promise<void> {
		await this.client.del(this.addPrefix(key));
	}

	async setHash(key: string, value: Record<string, any>, ttl?: number | undefined): Promise<void> {
		if (await this.isLocked()) return;

		const _key = this.addPrefix(key);

		const values = [];

		for (const [key, val] of Object.entries(value)) {
			values.push(key, stringify(await compress(val)));
		}

		values.push('#full', 'true');
		await this.client.sendCommand(['HSET', _key, ...values]);

		if (ttl !== undefined) await this.client.expire(_key, ttl);
	}

	async getHash(key: string): Promise<Record<string, any> | null> {
		const value = await this.client.hGetAll(this.addPrefix(key));
		if (value === null) return null;
		const entries = Object.entries(value).filter(([key]) => !key.startsWith('#'));

		return Object.fromEntries(
			await map(entries, async ([key, val]: [string, any]) => [key, await decompress(parse(val))])
		);
	}

	async isHashFull(key: string): Promise<boolean> {
		return (await this.client.hGet(this.addPrefix(key), '#full')) === 'true';
	}

	async setHashField(key: string, field: string, value: any, ttl?: number | undefined): Promise<void> {
		if (await this.isLocked()) return;

		const _key = this.addPrefix(key);

		await this.client.hSet(_key, field, stringify(await compress(value)));
		if (ttl !== undefined) await this.client.expire(_key, ttl);
	}
	async getHashField(key: string, field: string): Promise<any | null> {
		const value = await this.client.hGet(this.addPrefix(key), field);

		if (value === undefined) return null;

		return await decompress(parse(value));
	}

	async deleteHashField(key: string, field: string | string[]): Promise<void> {
		const fields = Array.isArray(field) ? field : [field];
		await this.client.sendCommand(['HDEL', this.addPrefix(key), '$full', ...fields]);
	}
}
