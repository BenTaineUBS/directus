export type Method =
	| 'get'
	| 'GET'
	| 'search'
	| 'SEARCH'
	| 'delete'
	| 'DELETE'
	| 'head'
	| 'HEAD'
	| 'options'
	| 'OPTIONS'
	| 'post'
	| 'POST'
	| 'put'
	| 'PUT'
	| 'patch'
	| 'PATCH'
	| 'purge'
	| 'PURGE'
	| 'link'
	| 'LINK'
	| 'unlink'
	| 'UNLINK';

export interface RequestProxyConfig {
	protocol: 'http' | 'https';
	host: string;
	port: number;
	auth?: {
		username: string;
		password: string;
	};
}

export interface RequestOptions {
	timeout?: number;
	maxRedirects?: number;
}

export interface RequestConfig {
	url: string;
	method: Method;
	data?: any;
	headers?: Record<string, any>;
	options?: RequestOptions;
}
