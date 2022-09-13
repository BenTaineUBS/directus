import { AbstractServiceOptions } from '@directus/shared/services';
import { OperationRaw } from '@directus/shared/types';
import { getFlowManager } from '../flows';
import { Item, MutationOptions, PrimaryKey } from '../types';
import { ItemsService } from './items';

export class OperationsService extends ItemsService<OperationRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_operations', options);
	}

	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const flowManager = getFlowManager();

		const result = await super.createOne(data, opts);
		await flowManager.reload();

		return result;
	}

	async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.createMany(data, opts);
		await flowManager.reload();

		return result;
	}

	async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const flowManager = getFlowManager();

		const result = await super.updateOne(key, data, opts);
		await flowManager.reload();

		return result;
	}

	async updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.updateBatch(data, opts);
		await flowManager.reload();

		return result;
	}

	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.updateMany(keys, data, opts);
		await flowManager.reload();

		return result;
	}

	async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		const flowManager = getFlowManager();

		const result = await super.deleteOne(key, opts);
		await flowManager.reload();

		return result;
	}

	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.deleteMany(keys, opts);
		await flowManager.reload();

		return result;
	}
}
