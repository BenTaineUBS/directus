import { i18n } from '@/lang';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import { defineDisplay, getFieldsFromTemplate } from '@directus/shared/utils';
import { get, set } from 'lodash';
import DisplayTranslations from './translations.vue';
import { useExtension } from '@/composables/use-extension';

export default defineDisplay({
	id: 'translations',
	name: '$t:displays.translations.translations',
	description: '$t:displays.translations.description',
	icon: 'translate',
	component: DisplayTranslations,
	handler: (values, options, { collection, field }) => {
		if (!field || !collection || !Array.isArray(values)) return values;

		const relatedCollectionInfo = getRelatedCollection(collection, field.field);

		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		if (!relatedCollectionInfo) return values;

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollectionInfo.junctionCollection!);

		if (
			!primaryKeyField ||
			!relatedCollectionInfo?.relatedCollection ||
			Array.isArray(relatedCollectionInfo.relatedCollection)
		)
			return values;

		const relatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollectionInfo.relatedCollection);

		if (!relatedPrimaryKeyField) return values;

		const value =
			values.find((translatedItem: Record<string, any>) => {
				const lang = translatedItem[relatedCollectionInfo.path!][relatedPrimaryKeyField.field];

				// Default to first item if lang can't be found
				if (!lang) return true;

				if (options.userLanguage) {
					return lang === i18n.global.locale.value;
				}

				return lang === options.defaultLanguage;
			}) ?? values[0];

		const fieldKeys = getFieldsFromTemplate(options.template);

		const fields = fieldKeys.map((fieldKey) => {
			return {
				key: fieldKey,
				field: fieldsStore.getField(relatedCollectionInfo.relatedCollection as string, fieldKey),
			};
		});

		const stringValues: Record<string, string> = {};

		for (const { key, field } of fields) {
			const fieldValue = get(value, key);

			if (fieldValue === null || fieldValue === undefined) continue;

			if (!field?.meta?.display) {
				set(stringValues, key, fieldValue);
				continue;
			}

			const display = useExtension('display', field.meta.display);

			const stringValue = display.value?.handler
				? display.value.handler(fieldValue, field?.meta?.display_options ?? {}, {
						interfaceOptions: field?.meta?.options ?? {},
						field: field ?? undefined,
						collection: collection,
				  })
				: fieldValue;

			set(stringValues, key, stringValue);
		}

		return renderPlainStringTemplate(options.template, stringValues);
	},
	options: ({ relations }) => {
		const fieldsStore = useFieldsStore();

		const junctionCollection = relations.o2m?.collection;
		const relatedCollection = relations.m2o?.related_collection;

		const languageFields = relatedCollection ? fieldsStore.getFieldsForCollection(relatedCollection) : [];

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: junctionCollection,
					},
					width: 'half',
				},
			},
			{
				field: 'languageField',
				name: '$t:displays.translations.language_field',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: languageFields.map(({ field, name }) => ({ text: name, value: field })),
					},
					width: 'half',
				},
			},
			{
				field: 'defaultLanguage',
				name: '$t:displays.translations.default_language',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: '$t:primary_key',
					},
				},
			},
			{
				field: 'userLanguage',
				name: '$t:displays.translations.user_language',
				type: 'string',
				schema: {
					default_value: 'false',
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:displays.translations.enable',
					},
					width: 'half',
				},
			},
		];
	},
	types: ['alias'],
	localTypes: ['translations'],
	fields: ['*'],
});
