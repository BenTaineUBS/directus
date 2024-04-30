import { COLLECTIONS_DENY_LIST } from '@/constants';
import { i18n } from '@/lang';
import { Collection } from '@/types/collections';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import formatTitle from '@directus/format-title';
import { Collection as CollectionRaw } from '@directus/types';
import { getCollectionType } from '@directus/utils';
import { isEqual, isNil, omit, orderBy } from 'lodash';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRelationsStore } from './relations';
import { isSystemCollection } from '@directus/system-data';
import {
	DirectusCollection,
	NestedPartial,
	createCollection as createCollectionCmd,
	deleteCollection as deleteCollectionCmd,
	readCollections as readCollectionsCmd,
	updateCollection as updateCollectionCmd,
} from '@directus/sdk';
import sdk from '@/sdk';

export const useCollectionsStore = defineStore('collectionsStore', () => {
	const collections = ref<Collection[]>([]);

	const visibleCollections = computed(() =>
		collections.value
			.filter(({ collection }) => isSystemCollection(collection) === false)
			.filter((collection) => collection.meta && collection.meta?.hidden !== true),
	);

	const allCollections = computed(() =>
		collections.value.filter(({ collection }) => isSystemCollection(collection) === false),
	);

	const databaseCollections = computed(() => allCollections.value.filter((collection) => collection.schema));

	const crudSafeSystemCollections = computed(() =>
		orderBy(
			collections.value.filter((collection) => isSystemCollection(collection.collection)),
			'collection',
		).filter((collection) => COLLECTIONS_DENY_LIST.includes(collection.collection) === false),
	);

	return {
		collections,
		visibleCollections,
		allCollections,
		databaseCollections,
		crudSafeSystemCollections,
		hydrate,
		dehydrate,
		prepareCollectionForApp,
		translateCollections,
		upsertCollection,
		updateCollection,
		deleteCollection,
		getCollection,
	};

	async function hydrate() {
		const rawCollections = await sdk.request<CollectionRaw[]>(readCollectionsCmd());

		collections.value = rawCollections.map(prepareCollectionForApp);
	}

	async function dehydrate() {
		collections.value = [];
	}

	function prepareCollectionForApp(collection: CollectionRaw): Collection {
		const icon = collection.meta?.icon || 'database';
		const color = collection.meta?.color;
		let name = formatTitle(collection.collection);
		const type = getCollectionType(collection);

		const localesToKeep =
			collection.meta && !isNil(collection.meta.translations) && Array.isArray(collection.meta.translations)
				? collection.meta.translations.map((translation) => translation.language)
				: [];

		for (const locale of i18n.global.availableLocales) {
			if (i18n.global.te(`collection_names.${collection.collection}`, locale) && !localesToKeep.includes(locale)) {
				i18n.global.mergeLocaleMessage(locale, { collection_names: { [collection.collection]: undefined } });
			}
		}

		if (collection.meta && Array.isArray(collection.meta.translations)) {
			for (const { language, translation, singular, plural } of collection.meta.translations) {
				i18n.global.mergeLocaleMessage(language, {
					...(translation
						? {
								collection_names: {
									[collection.collection]: getLiteralInterpolatedTranslation(translation),
								},
						  }
						: {}),
					...(singular
						? {
								collection_names_singular: {
									[collection.collection]: getLiteralInterpolatedTranslation(singular),
								},
						  }
						: {}),
					...(plural
						? {
								collection_names_plural: {
									[collection.collection]: getLiteralInterpolatedTranslation(plural),
								},
						  }
						: {}),
				});
			}
		}

		if (i18n.global.te(`collection_names.${collection.collection}`)) {
			name = i18n.global.t(`collection_names.${collection.collection}`);
		}

		return {
			...collection,
			name,
			type,
			icon,
			color,
		};
	}

	function translateCollections() {
		collections.value = collections.value.map((collection) => {
			if (i18n.global.te(`collection_names.${collection.collection}`)) {
				collection.name = i18n.global.t(`collection_names.${collection.collection}`);
			}

			return collection;
		});
	}

	async function upsertCollection(collection: string, values: NestedPartial<DirectusCollection<any>>) {
		const existing = getCollection(collection);

		// Strip out any fields the app might've auto-generated at some point
		const rawValues = omit(values, ['name', 'type', 'icon', 'color']);

		try {
			if (existing) {
				if (isEqual(existing, values)) return;

				const updatedCollectionResponse = await sdk.request<CollectionRaw>(updateCollectionCmd(collection, rawValues));

				collections.value = collections.value.map((existingCollection: Collection) => {
					if (existingCollection.collection === collection) {
						return prepareCollectionForApp(updatedCollectionResponse);
					}

					return existingCollection;
				});
			} else {
				const createdCollectionResponse = await sdk.request<CollectionRaw>(createCollectionCmd(rawValues));

				collections.value = [...collections.value, prepareCollectionForApp(createdCollectionResponse)];
			}
		} catch (error) {
			unexpectedError(error);
		}
	}

	async function updateCollection(collection: string, updates: NestedPartial<DirectusCollection<any>>) {
		try {
			await sdk.request(updateCollectionCmd(collection, updates));
			await hydrate();

			notify({
				title: i18n.global.t('update_collection_success'),
			});
		} catch (error) {
			unexpectedError(error);
		}
	}

	async function deleteCollection(collection: string) {
		const relationsStore = useRelationsStore();

		try {
			await sdk.request(deleteCollectionCmd(collection));
			await Promise.all([hydrate(), relationsStore.hydrate()]);

			notify({
				title: i18n.global.t('delete_collection_success'),
			});
		} catch (error) {
			unexpectedError(error);
		}
	}

	function getCollection(collectionKey: string): Collection | null {
		return collections.value.find((collection) => collection.collection === collectionKey) || null;
	}
});
