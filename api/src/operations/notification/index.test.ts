import { afterEach, describe, expect, test, vi } from 'vitest';

import { NotificationsService } from '../../services';
import config from './index';

const getSchema = vi.fn().mockResolvedValue({});

vi.mock('../../services', () => {
	const NotificationsService = vi.fn();
	NotificationsService.prototype.createMany = vi.fn();
	return { NotificationsService };
});

vi.mock('../../utils/get-accountability-for-role', () => ({
	getAccountabilityForRole: vi.fn((role: string | null, _context) => Promise.resolve(role)),
}));

const testId = '00000000-0000-0000-0000-000000000000';

const testAccountability = { user: testId, role: testId };

const testRecipient = [testId];

describe('Operations / Notification', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test.each([
		{ permissions: undefined, expected: testAccountability },
		{ permissions: '$trigger', expected: testAccountability },
		{ permissions: '$full', expected: null },
		{ permissions: '$public', expected: null },
		{ permissions: 'test', expected: 'test' },
	])('accountability for permissions "$permissions" should be $expected', async ({ permissions, expected }) => {
		await config.handler({ permissions } as any, { accountability: testAccountability, getSchema } as any);

		expect(NotificationsService).toHaveBeenCalledWith(expect.objectContaining({ accountability: expected }));
	});

	test.each([
		{ message: null, expected: null },
		{ message: 123, expected: '123' },
		{ message: { test: 'test' }, expected: '{"test":"test"}' },
	])('message $message should be sent as string $expected', async ({ message, expected }) => {
		await config.handler(
			{ recipient: testRecipient, message } as any,
			{ accountability: testAccountability, getSchema } as any
		);

		expect(NotificationsService.prototype.createMany).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ message: expected })])
		);
	});
});
