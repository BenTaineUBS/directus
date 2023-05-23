import type { Knex } from 'knex';
import { set } from 'lodash-es';

type NewTranslationString = {
	key: string;
	value: string;
	language: string;
};

type OldTranslationString = {
	key?: string | null;
	translations?: Record<string, string> | null;
};

function transformStringsNewFormat(oldStrings: OldTranslationString[]): NewTranslationString[] {
	return oldStrings.reduce<NewTranslationString[]>((result, item) => {
		if (!item.key || !item.translations) return result;

		for (const [language, value] of Object.entries(item.translations)) {
			result.push({ key: item.key, language, value });
		}

		return result;
	}, []);
}

function transformStringsOldFormat(newStrings: NewTranslationString[]): OldTranslationString[] {
	const keyCache: Record<string, Record<string, string>> = {};

	for (const { key, language, value } of newStrings) {
		set(keyCache, [key, language], value);
	}

	return Object.entries(keyCache).map(([key, translations]) => ({ key, translations } as OldTranslationString));
}

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_translation_strings', (table) => {
		table.increments('id', { primaryKey: true });
		table.string('language').notNullable();
		table.string('key').notNullable();
		table.string('value').notNullable();
	});

	const data = await knex.select('translation_strings', 'id').from('directus_settings').first();

	if (data?.translation_strings && data?.id) {
		const parsedTranslationStrings =
			typeof data.translation_strings === 'string' ? JSON.parse(data.translation_strings) : data.translation_strings;

		const newTranslationStrings = transformStringsNewFormat(parsedTranslationStrings);

		for (const item of newTranslationStrings) {
			await knex('directus_translation_strings').insert(item);
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	const data = await knex.select('language', 'key', 'value').from('directus_translation_strings');
	const settingsId = await knex.select('id').from('directus_settings').first();

	if (settingsId?.id && data) {
		const oldTranslationStrings = transformStringsOldFormat(data);

		await knex('directus_settings')
			.where({ id: settingsId.id })
			.update({
				translation_strings: JSON.stringify(oldTranslationStrings),
			});
	}

	await knex.schema.dropTable('directus_translation_strings');
}
