import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumns('many_primary', 'one_primary');
		table.string('one_deselect_action').defaultTo('nullify');
	});

	await knex('directus_relations').update({ one_deselect_action: 'nullify' });

	await helper.changeToString('directus_relations', 'sort_field', {
		length: 64,
	});

	await helper.changeToString('directus_relations', 'one_deselect_action', {
		nullable: false,
		default: 'nullify',
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToString('directus_relations', 'sort_field', {
		length: 255,
	});

	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumn('one_deselect_action');
		table.string('many_primary', 64);
		table.string('one_primary', 64);
	});
}
