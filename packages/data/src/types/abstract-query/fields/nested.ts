import type { AbstractQueryFieldNodeNestedSingleObject } from '../common/nested/object.js';
import type {
	AbstractQueryFieldNodeNestedSingleRelational,
	AbstractQueryFieldNodeNestedUnionRelational,
} from '../common/nested/relational.js';
import type { AbstractQueryFieldNode } from '../fields.js';
import type { AbstractQueryModifiers } from '../modifiers.js';

/**
 * A related, foreign field for m2o.
 * The foreign collection is static.
 */
export interface AbstractQueryFieldNodeNestedSingleOne {
	type: 'nested-single-one';

	/* From the nested collection/object the user can pick primitives, apply a function or add another nested node   */
	fields: AbstractQueryFieldNode[];

	alias: string;

	nesting: AbstractQueryFieldNodeNestedSingleRelational | AbstractQueryFieldNodeNestedSingleObject;
}

/**
 * A related, foreign field for a2o.
 * The foreign collection is dynamic.
 */
export interface AbstractQueryFieldNodeNestedUnionOne {
	type: 'nested-union-one';

	alias: string;

	nesting: AbstractQueryFieldNodeNestedUnionRelational;
}

/**
 * A related, foreign field for o2m and o2a.
 * The foreign collection is static.
 */
export interface AbstractQueryFieldNodeNestedSingleMany {
	type: 'nested-single-many';

	/* From the related collection the user can pick primitives, apply a function or add another nested node */
	fields: AbstractQueryFieldNode[];

	alias: string;

	/** For many, it's always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers: AbstractQueryModifiers;

	nesting: AbstractQueryFieldNodeNestedSingleRelational;
}

/**
 * A related, foreign field for o2a.
 */
export interface AbstractQueryFieldNodeNestedUnionMany {
	type: 'nested-union-many';

	alias: string;

	/** For many, it's always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers: AbstractQueryModifiers;

	nesting: AbstractQueryFieldNodeNestedUnionRelational;
}
