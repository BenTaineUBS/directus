import type { FetchInterface, UrlInterface, WebSocketInterface } from "./fetch.js";

/**
 * empty directus client
 */
export interface DirectusClient<Schema extends object> {
	url: URL;
	globals: ClientGlobals;
	with: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}

/**
 * All used globals for the client
 */
export interface ClientGlobals {
	fetch: FetchInterface;
	WebSocket: WebSocketInterface;
	URL: UrlInterface;
}

/**
 * Available options on the client
 */
export interface ClientOptions {
	globals?: Partial<ClientGlobals>;
}
