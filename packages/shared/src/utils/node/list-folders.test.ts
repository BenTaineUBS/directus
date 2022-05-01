import { listFolders } from './list-folders';
import { dirSync, SynchronousResult } from 'tmp';

describe('', () => {
	let rootDir: SynchronousResult;
	let childDir: SynchronousResult;

	beforeEach(() => {
		rootDir = dirSync({ unsafeCleanup: true, tmpdir: './' } as any);
		childDir = dirSync({ tmpdir: rootDir.name } as any);
	});

	afterEach(() => {
		rootDir.removeCallback();
	});
	it('returns all the subdirectories of the current directory', async () => {
		const childPath = childDir.name.split('/');
		expect(await listFolders(rootDir.name)).toStrictEqual([childPath[childPath?.length - 1]]);
	});
});
