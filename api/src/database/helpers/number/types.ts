import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';

export class NumberSearchHelper extends DatabaseHelper {
	orWhere(dbQuery: Knex.QueryBuilder, collection: string, name: string, value: number, _type: string): Knex.QueryBuilder {
		return dbQuery.orWhere({ [`${collection}.${name}`]: value });
	}
}
