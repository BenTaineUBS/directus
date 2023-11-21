import { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { createReadStream } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const assetsDirectory = [paths.cwd, 'assets'];
const storages = ['local', 'minio'];

const imageFileAvif = join(...assetsDirectory, 'directus.avif');
const imageFilePng = join(...assetsDirectory, 'directus.png');

describe('/assets', () => {
	describe('GET /assets/:id', () => {
		describe('format=auto Tests', () => {
			describe('without Accept request header', () => {
				describe.each(storages)('Storage: %s', (storage) => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const insertResponse = await request(getUrl(vendor))
							.post('/files')
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
							.field('storage', storage)
							.attach('file', createReadStream(imageFileAvif));

						// Action
						const response = await request(getUrl(vendor))
							.get(`/assets/${insertResponse.body.data.id}?format=auto`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(200);
						expect(response.headers['content-type']).toBe('image/png'); // Expect fallback to png for image format with transparency support
					});
				});
			});

			describe.each([
				{ requestHeaderAccept: 'image/avif,image/webp,image/*,*/*;q=0.8', responseHeaderContentType: 'image/avif' },
				{ requestHeaderAccept: 'image/avif', responseHeaderContentType: 'image/avif' },
				{ requestHeaderAccept: 'image/webp', responseHeaderContentType: 'image/webp' },
				{ requestHeaderAccept: '*/*', responseHeaderContentType: 'image/png' }, // Expect to return png as original image is png
			])('with "$requestHeaderAccept" Accept request header', ({ requestHeaderAccept, responseHeaderContentType }) => {
				describe.each(storages)('Storage: %s', (storage) => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const insertResponse = await request(getUrl(vendor))
							.post('/files')
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
							.field('storage', storage)
							.attach('file', createReadStream(imageFilePng));

						console.log(insertResponse.statusCode);
						console.log(insertResponse.body);

						// Action
						const response = await request(getUrl(vendor))
							.get(`/assets/${insertResponse.body.data.id}?format=auto`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
							.set('Accept', requestHeaderAccept);

						console.log(response.statusCode);
						console.log(response.body);

						// Assert
						expect(response.statusCode).toBe(200);
						expect(response.headers['content-type']).toBe(responseHeaderContentType);
					});
				});
			});
		});
	});
});
