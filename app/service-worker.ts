import { defaultCache, PAGES_CACHE_NAME } from '@serwist/next/worker';
import type {
	PrecacheEntry,
	RuntimeCaching,
	SerwistGlobalConfig,
} from 'serwist';
import { ExpirationPlugin, NetworkFirst, Serwist } from 'serwist';

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: WorkerGlobalScope;

const NETWORK_TIMEOUT_SECONDS = 3;
const PAGE_CACHE_MAX_ENTRIES = 32;
const PAGE_CACHE_MAX_AGE_SECONDS = 24 * 60 * 60;

function boundedPageStrategy(cacheName: string) {
	return new NetworkFirst({
		cacheName,
		networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
		plugins: [
			new ExpirationPlugin({
				maxEntries: PAGE_CACHE_MAX_ENTRIES,
				maxAgeSeconds: PAGE_CACHE_MAX_AGE_SECONDS,
			}),
		],
	});
}

function isPageRequest(url: URL, sameOrigin: boolean): boolean {
	return sameOrigin && !url.pathname.startsWith('/api/');
}

/**
 * Navigation and RSC caching with a bounded network wait, layered before Serwist's defaults.
 * `defaultCache` serves both with NetworkFirst and no `networkTimeoutSeconds`, so a dead or
 * lie-fi network stalls the launch indefinitely instead of painting the last visited page.
 * Cache names are reused, so this replaces the default entries rather than duplicating storage.
 */
const boundedPageCache: RuntimeCaching[] = [
	{
		matcher: ({ request, url, sameOrigin }) =>
			request.headers.get('RSC') === '1' &&
			request.headers.get('Next-Router-Prefetch') === '1' &&
			isPageRequest(url, sameOrigin),
		handler: boundedPageStrategy(PAGES_CACHE_NAME.rscPrefetch),
	},
	{
		matcher: ({ request, url, sameOrigin }) =>
			request.headers.get('RSC') === '1' && isPageRequest(url, sameOrigin),
		handler: boundedPageStrategy(PAGES_CACHE_NAME.rsc),
	},
	{
		matcher: ({ request, url, sameOrigin }) =>
			request.destination === 'document' && isPageRequest(url, sameOrigin),
		handler: boundedPageStrategy(PAGES_CACHE_NAME.html),
	},
];

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [...boundedPageCache, ...defaultCache],
	fallbacks: {
		entries: [
			{
				url: '/fr/offline',
				matcher({ request, url }) {
					return (
						request.destination === 'document' &&
						url.pathname.startsWith('/fr')
					);
				},
			},
			{
				url: '/en/offline',
				matcher({ request }) {
					return request.destination === 'document';
				},
			},
		],
	},
});

serwist.addEventListeners();
