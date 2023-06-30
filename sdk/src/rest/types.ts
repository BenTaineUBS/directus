import type { RequestOptions } from '../types/request.js';

export interface RestCommand<_Output extends object | unknown, _Schema extends object> {
	(): RequestOptions;
}

export interface RestClient<Schema extends object> {
	request<Output extends object>(options: RestCommand<Output, Schema>): Promise<Output>;
}

export interface RestConfig {
	globalOptions?: Partial<RequestInit>;
	onError?: (error: any) => any;
}
