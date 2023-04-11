import { BaseException } from '@directus/exceptions';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import emitter from '../emitter.js';
import * as env from '../env.js';
import { MethodNotAllowedException } from '../exceptions/index.js';

vi.mock('../env', () => ({
	default: {},
}));

vi.mock('../emitter', () => ({
	default: {
		emitFilter: vi.fn().mockResolvedValue(true),
	},
}));

vi.mock('../logger', () => ({
	default: {
		debug: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('../database', () => ({
	default: vi.fn(),
}));

const modulePath = './error-handler.js';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();
const resStatus = vi.fn();
const resHeader = vi.fn();
const requestErrorEvent = 'request.error';
const adminAccountability = { admin: true, role: '00000000-0000-0000-0000-000000000000' };

beforeEach(() => {
	mockRequest = {};
	mockResponse = { status: resStatus, header: resHeader, json: vi.fn() };
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should set response status to 500 if any error is not an instance of BaseException', async () => {
	const status = 400;
	const genericError = { status };

	const errorHandler = (await import(modulePath)).default;
	await errorHandler([genericError], mockRequest as Request, mockResponse as Response, nextFunction);

	expect(resStatus).toHaveBeenLastCalledWith(500);
});

test('should set response status to 400 if all errors are an instance of BaseException', async () => {
	const status = 400;
	const message = 'Test Error';
	const code = 'TEST01';
	const error = new BaseException(message, status, code);

	const errorHandler = (await import(modulePath)).default;
	await errorHandler([error], mockRequest as Request, mockResponse as Response, nextFunction);

	expect(resStatus).toHaveBeenLastCalledWith(status);
});

test('should add error stack to extensions in development', async () => {
	const status = 400;
	const message = 'Test Error';
	const code = 'TEST01';
	const stack = 'Test Stack';
	const error = new BaseException(message, status, code);
	error.stack = stack;

	(env.default as Record<string, any>) = { NODE_ENV: 'development' };
	const errorHandler = (await import(modulePath)).default;

	await errorHandler([error], mockRequest as Request, mockResponse as Response, nextFunction);

	expect(resStatus).toHaveBeenLastCalledWith(status);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][0]).toBe(requestErrorEvent);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][1]).toEqual([
		{
			extensions: {
				code,
				stack,
			},
			message,
		},
	]);
});

test('should not add error stack to extensions in production', async () => {
	const status = 400;
	const message = 'Test Error';
	const code = 'TEST01';
	const stack = 'Test Stack';
	const error = new BaseException(message, status, code);
	error.stack = stack;

	(env.default as Record<string, any>) = { NODE_ENV: 'production' };
	const errorHandler = (await import(modulePath)).default;

	await errorHandler([error], mockRequest as Request, mockResponse as Response, nextFunction);

	expect(resStatus).toHaveBeenLastCalledWith(status);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][0]).toBe(requestErrorEvent);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][1]).toEqual([
		{
			extensions: {
				code,
			},
			message,
		},
	]);
});

test('should set Allow header for MethodNotAllowedException error', async () => {
	const message = 'Test Error';
	const method = 'POST';
	const extensions = { allow: [method] };
	const error = new MethodNotAllowedException(message, extensions);

	const errorHandler = (await import(modulePath)).default;
	await errorHandler([error], mockRequest as Request, mockResponse as Response, nextFunction);

	expect(resHeader).toHaveBeenLastCalledWith('Allow', method);
});

test('should respond with detailed generic error when authenticated as admin', async () => {
	const status = 400;
	const message = 'Test Error';
	const extensions = { additionalExtension: 'test' };
	const genericError = { message, status, extensions };
	mockRequest = { accountability: adminAccountability };

	const errorHandler = (await import(modulePath)).default;
	await errorHandler([genericError], mockRequest as Request, mockResponse as Response, nextFunction);

	expect(resStatus).toHaveBeenLastCalledWith(500);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][0]).toBe(requestErrorEvent);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][1]).toEqual([
		{
			extensions: {
				code: 'INTERNAL_SERVER_ERROR',
				...extensions,
			},
			message,
		},
	]);
});

test('should respond with simple generic error when not authenticated as admin', async () => {
	const status = 400;
	const message = 'Test Error';
	const genericError = { message, status };

	const errorHandler = (await import(modulePath)).default;
	await errorHandler([genericError], mockRequest as Request, mockResponse as Response, nextFunction);

	expect(resStatus).toHaveBeenLastCalledWith(500);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][0]).toBe(requestErrorEvent);
	expect(vi.mocked(emitter.emitFilter).mock.calls[0][1]).toEqual([
		{
			extensions: {
				code: 'INTERNAL_SERVER_ERROR',
			},
			message: 'An unexpected error occurred.',
		},
	]);
});
