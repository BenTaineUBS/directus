import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem } from '@common/functions';
import { CachedTestsSchema, TestsSchemaVendorValues } from '@query/filter';
import * as common from '@common/index';
import {
	collectionCountries,
	collectionStates,
	collectionCities,
	Country,
	State,
	City,
	getTestsSchema,
	seedDBValues,
} from './o2m.seed';
import { CheckQueryFilters } from '@query/filter';
import { findIndex } from 'lodash';

function createCountry(pkType: common.PrimaryKeyType) {
	const item: Country = {
		name: 'country-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'country-' + uuid();
	}

	return item;
}

function createState(pkType: common.PrimaryKeyType) {
	const item: State = {
		name: 'state-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'state-' + uuid();
	}

	return item;
}

function createCity(pkType: common.PrimaryKeyType) {
	const item: City = {
		name: 'city-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'city-' + uuid();
	}

	return item;
}

const cachedSchema = common.PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
	acc[pkType] = getTestsSchema(pkType);
	return acc;
}, {} as CachedTestsSchema);

const vendorSchemaValues: TestsSchemaVendorValues = {};

beforeAll(async () => {
	await seedDBValues(cachedSchema, vendorSchemaValues);
}, 300000);

describe('Seed Database Values', () => {
	it.each(vendors)('%s', async (vendor) => {
		// Assert
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

describe.each(common.PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionCountries = `${collectionCountries}_${pkType}`;
	const localCollectionStates = `${collectionStates}_${pkType}`;
	const localCollectionCities = `${collectionCities}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
			describe('retrieves one country', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const country = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCountries}/${country.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one state', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const state = await CreateItem(vendor, { collection: localCollectionStates, item: createState(pkType) });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}/${state.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one city', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const city = await CreateItem(vendor, { collection: localCollectionCities, item: createCity(pkType) });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCities}/${city.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe(`retrieves a state's country`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedCountry = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});
					const state = createState(pkType);
					state.country_id = insertedCountry.id;
					const insertedState = await CreateItem(vendor, { collection: localCollectionStates, item: state });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}/${insertedState.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ country_id: insertedCountry.id });
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid id is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}/invalid_id`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/invalid_table/1`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.status).toBe(403);
					});
				});
			});
		});
		describe('PATCH /:collection/:id', () => {
			describe(`updates one country's name with no relations`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});
					const body = { name: 'Tommy Cash' };

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionCountries}/${insertedArtist.id}`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({
						id: insertedArtist.id,
						name: 'Tommy Cash',
					});
				});
			});
		});
		describe('DELETE /:collection/:id', () => {
			describe('deletes an country with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionCountries}/${insertedArtist.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);
				});
			});
		});
		describe('GET /:collection', () => {
			describe('retrieves all items from country table with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const countries = [];
					const countriesCount = 50;
					for (let i = 0; i < countriesCount; i++) {
						countries.push(createCountry(pkType));
					}
					await CreateItem(vendor, { collection: localCollectionCountries, item: countries });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCountries}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBeGreaterThanOrEqual(countriesCount);
				});
			});
			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/invalid_table`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
			});

			describe(`filters`, () => {
				describe(`on top level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);
						country.name = 'country-o2m-top-' + uuid();
						const insertedCountry = await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: country,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: { id: { _eq: insertedCountry.id } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: { name: { _eq: insertedCountry.name } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedCountry.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);
					});
				});

				describe(`on o2m level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);
						country.name = 'country-o2m-' + uuid();
						const insertedCountry = await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: country,
						});
						const state = createState(pkType);
						state.name = 'state-o2m-' + uuid();
						state.country_id = insertedCountry.id;
						const insertedState = await CreateItem(vendor, { collection: localCollectionStates, item: state });

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: JSON.stringify({ states: { id: { _eq: insertedState.id } } }),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: JSON.stringify({ states: { name: { _eq: insertedState.name } } }),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedCountry.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);
					});
				});
			});

			describe('filters with functions', () => {
				describe('on top level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: {
								...createCountry(pkType),
								name: 'test_country_top',
								states: {
									create: [
										{
											...createState(pkType),
											name: 'test_state_top_1',
										},
										{
											...createState(pkType),
											name: 'test_state_top_2',
										},
									],
									update: [],
									delete: [],
								},
							},
						});

						await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: {
								...createCountry(pkType),
								name: 'test_country_top',
							},
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: JSON.stringify({
									_and: [
										{
											name: { _eq: 'test_country_top' },
										},
										{
											'count(states)': { _eq: 2 },
										},
									],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const responseTotal = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: JSON.stringify({
									name: { _eq: 'test_country_top' },
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toEqual(1);
						expect(responseTotal.statusCode).toEqual(200);
						expect(responseTotal.body.data.length).toEqual(2);
					});
				});

				describe('on o2m level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: {
								...createCountry(pkType),
								name: 'test_country_nested',
								states: {
									create: [
										{
											...createState(pkType),
											name: 'test_state_nested_1',
											cities: {
												create: [
													{
														...createCity(pkType),
														name: 'test_city_nested_1',
													},
													{
														...createState(pkType),
														name: 'test_city_nested_2',
													},
												],
												update: [],
												delete: [],
											},
										},
										{
											...createState(pkType),
											name: 'test_state_nested_2',
											cities: {
												create: [
													{
														...createCity(pkType),
														name: 'test_city_nested_3',
													},
													{
														...createState(pkType),
														name: 'test_city_nested_4',
													},
												],
												update: [],
												delete: [],
											},
										},
									],
									update: [],
									delete: [],
								},
							},
						});

						await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: {
								...createCountry(pkType),
								name: 'test_country_nested',
								states: {
									create: [
										{
											...createState(pkType),
											name: 'test_state_nested_3',
											cities: {
												create: [
													{
														...createCity(pkType),
														name: 'test_city_nested_5',
													},
												],
												update: [],
												delete: [],
											},
										},
										{
											...createState(pkType),
											name: 'test_state_nested_4',
											cities: {
												create: [
													{
														...createCity(pkType),
														name: 'test_city_nested_6',
													},
												],
												update: [],
												delete: [],
											},
										},
									],
									update: [],
									delete: [],
								},
							},
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: JSON.stringify({
									_and: [
										{
											name: { _eq: 'test_country_nested' },
										},
										{
											states: {
												'count(cities)': { _eq: 2 },
											},
										},
										{
											states: {
												country_id: {
													'count(states)': { _eq: 2 },
												},
											},
										},
									],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const responseTotal = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								filter: JSON.stringify({
									name: { _eq: 'test_country_nested' },
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toEqual(1);
						expect(responseTotal.statusCode).toEqual(200);
						expect(responseTotal.body.data.length).toEqual(2);
					});
				});
			});

			describe(`sorts`, () => {
				describe(`on top level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];
						const countries = [];

						for (const val of sortValues) {
							const country = createCountry(pkType);
							country.name = 'country-o2m-top-sort-' + val;
							countries.push(country);
						}

						await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: countries,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: 'name',
								filter: { name: { _starts_with: 'country-o2m-top-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: '-name',
								filter: { name: { _starts_with: 'country-o2m-top-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});

				describe(`on o2m level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];

						for (const val of sortValues) {
							const country = createCountry(pkType);
							country.name = 'country-o2m-sort-' + uuid();
							const insertedCountry = await CreateItem(vendor, {
								collection: localCollectionCountries,
								item: country,
							});
							const state = createState(pkType);
							state.name = 'state-o2m-sort-' + val;
							state.country_id = insertedCountry.id;
							await CreateItem(vendor, { collection: localCollectionStates, item: state });
						}

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: 'states.name',
								filter: { name: { _starts_with: 'country-o2m-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: '-states.name',
								filter: { name: { _starts_with: 'country-o2m-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(200);

						if (vendor === 'mysql5') {
							let lastIndex = -1;
							for (const item of response2.body.data.reverse()) {
								const foundIndex = findIndex(response.body.data, { id: item.id });
								if (foundIndex === -1) continue;

								expect(foundIndex).toBeGreaterThan(lastIndex);

								if (foundIndex > lastIndex) {
									lastIndex = foundIndex;
								}
							}
							return;
						}

						expect(response.body.data.length).toBe(5);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});
			});

			describe(`sorts with functions`, () => {
				describe(`on top level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];
						const countries = [];

						for (const val of sortValues) {
							const country = createCountry(pkType);
							country.name = 'country-o2m-top-sort-fn-' + uuid();
							country.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
								.toISOString()
								.slice(0, 19);
							countries.push(country);
						}

						await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: countries,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: 'year(test_datetime)',
								filter: { name: { _starts_with: 'country-o2m-top-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: '-year(test_datetime)',
								filter: { name: { _starts_with: 'country-o2m-top-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});

				describe(`on o2m level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];

						for (const val of sortValues) {
							const country = createCountry(pkType);
							country.name = 'country-o2m-sort-fn-' + uuid();
							const insertedCountry = await CreateItem(vendor, {
								collection: localCollectionCountries,
								item: country,
							});
							const state = createState(pkType);
							state.name = 'state-o2m-sort-fn-' + uuid();
							state.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`))).toISOString().slice(0, 19);
							state.country_id = insertedCountry.id;
							await CreateItem(vendor, { collection: localCollectionStates, item: state });
						}

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: 'states.year(test_datetime)',
								filter: { name: { _starts_with: 'country-o2m-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}`)
							.query({
								sort: '-states.year(test_datetime)',
								filter: { name: { _starts_with: 'country-o2m-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(200);

						// Oddity in MySQL5, looks to be indexing delays resulting in missing values
						if (vendor === 'mysql5') {
							let lastIndex = -1;
							for (const item of response2.body.data.reverse()) {
								const foundIndex = findIndex(response.body.data, { id: item.id });
								if (foundIndex === -1) continue;

								expect(foundIndex).toBeGreaterThan(lastIndex);

								if (foundIndex > lastIndex) {
									lastIndex = foundIndex;
								}
							}
							return;
						}

						expect(response.body.data.length).toBe(5);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});
			});

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCountries}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionCountries,
				cachedSchema[pkType][localCollectionCountries],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionStates}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionStates,
				cachedSchema[pkType][localCollectionStates],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCities}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionCities,
				cachedSchema[pkType][localCollectionCities],
				vendorSchemaValues
			);
		});

		describe('POST /:collection', () => {
			describe('createOne', () => {
				describe('creates one country', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionCountries}`)
							.send(country)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toMatchObject({ name: country.name });
					});
				});
			});
			describe('createMany', () => {
				describe('creates 5 countries', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const countries = [];
						const countriesCount = 5;
						for (let i = 0; i < countriesCount; i++) {
							countries.push(createCountry(pkType));
						}

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionCountries}`)
							.send(countries)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(countriesCount);
					});
				});
			});
			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/invalid_table`)
							.send(country)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
			});
		});

		describe('PATCH /:collection', () => {
			describe('updates many countries to a different name', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const countries = [];
					const countriesCount = 5;
					for (let i = 0; i < countriesCount; i++) {
						countries.push(createCountry(pkType));
					}

					const insertedCountries = await CreateItem(vendor, { collection: localCollectionCountries, item: countries });
					const keys = Object.values(insertedCountries ?? []).map((item: any) => item.id);

					const body = {
						keys: keys,
						data: { name: 'Johnny Cash' },
					};

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionCountries}?fields=name`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					for (let row = 0; row < response.body.data.length; row++) {
						expect(response.body.data[row]).toMatchObject({
							name: 'Johnny Cash',
						});
					}
					expect(response.body.data.length).toBe(keys.length);
				});
			});
		});

		describe('DELETE /:collection', () => {
			describe('deletes many countries with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const countries = [];
					const countriesCount = 10;
					for (let i = 0; i < countriesCount; i++) {
						countries.push(createCountry(pkType));
					}

					const insertedCountries = await CreateItem(vendor, { collection: localCollectionCountries, item: countries });
					const keys = Object.values(insertedCountries ?? []).map((item: any) => item.id);

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionCountries}`)
						.send(keys)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);
				});
			});
		});

		describe('Returns no duplicated results from joins', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				await CreateItem(vendor, {
					collection: localCollectionCountries,
					item: {
						...createCountry(pkType),
						name: 'test_country_duplicates',
						states: {
							create: [
								{
									...createState(pkType),
									name: 'test_state_duplicates_1',
								},
								{
									...createState(pkType),
									name: 'test_state_duplicates_2',
								},
							],
							update: [],
							delete: [],
						},
					},
				});

				// Action
				const o2mResponse = await request(getUrl(vendor))
					.get(`/items/${localCollectionCountries}`)
					.query({
						filter: JSON.stringify({
							_and: [
								{
									name: { _eq: 'test_country_duplicates' },
								},
								{
									states: {
										country_id: {
											id: { _nnull: true },
										},
									},
								},
							],
						}),
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				const m2oResponse = await request(getUrl(vendor))
					.get(`/items/${localCollectionStates}`)
					.query({
						filter: JSON.stringify({
							_and: [
								{
									name: { _starts_with: 'test_state_duplicates' },
								},
								{
									country_id: {
										states: {
											id: { _nnull: true },
										},
									},
								},
							],
						}),
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(o2mResponse.statusCode).toEqual(200);
				expect(o2mResponse.body.data.length).toEqual(1);
				expect(m2oResponse.statusCode).toEqual(200);
				expect(m2oResponse.body.data.length).toEqual(2);
			});
		});
	});
});
