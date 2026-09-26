import { networkInterfaces } from 'node:os';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './lib/i18n/config';

const isDev = process.env.NODE_ENV === 'development';

/**
 * IPv4 de la machine sur son réseau, pour tester depuis un téléphone en dev.
 * Sans elles, Next bloque `/_next/*` en cross-origin : le routeur client et les
 * Server Actions ne répondent plus et l'app paraît figée. Résolues à chaud plutôt
 * qu'écrites en dur, l'adresse changeant avec le réseau.
 */
function localNetworkOrigins(): string[] {
	return Object.values(networkInterfaces())
		.flat()
		.filter((details) => details?.family === 'IPv4' && !details.internal)
		.map((details) => details?.address ?? '')
		.filter(Boolean);
}
const supabaseHost = new URL(
	process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost'
).hostname;

const cspDirectives = [
	"default-src 'self'",
	"worker-src 'self'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.youtube.com https://s.ytimg.com`,
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"img-src 'self' data: blob: https://image.tmdb.org https://i.ytimg.com https://lh3.googleusercontent.com https://*.supabase.co https://cdn.watchmode.com https://*.mzstatic.com",
	"font-src 'self' data: https://fonts.gstatic.com",
	'frame-src https://www.youtube.com https://www.youtube-nocookie.com',
	`connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://image.tmdb.org https://api.watchmode.com https://www.youtube.com https://sentry.silexio.be${isDev ? ' ws: wss:' : ' wss:'}`,
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
];

const securityHeaders = [
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'X-DNS-Prefetch-Control', value: 'on' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(), geolocation=()',
	},
	{ key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
	...(!isDev
		? [
				{
					key: 'Strict-Transport-Security',
					value: 'max-age=63072000; includeSubDomains; preload',
				},
			]
		: []),
];

/** File-like paths skip the proxy and reached `[lang]` as a language, where the root layout's `notFound()` answered 500; `afterFiles` keeps real files first. */
const unmatchedFileRewrite = {
	source: `/:path((?!(?:${SUPPORTED_LANGUAGES.join('|')}|_next)/).+\\.\\w+)`,
	destination: `/${DEFAULT_LANGUAGE}/:path`,
};

/** "use cache" keeps each entry as a buffered stream, several times its declared size: at the 50 Mo default the heap kept growing under bot crawls (327 Mo retained after 9 500 pages); 10 Mo plateaus near 135 Mo. */
const CACHE_MAX_MEMORY_BYTES = 10 * 1024 * 1024;

const nextConfig: NextConfig = {
	output: 'standalone',
	cacheMaxMemorySize: CACHE_MAX_MEMORY_BYTES,
	cacheComponents: true,
	allowedDevOrigins: localNetworkOrigins(),
	experimental: {
		isrFlushToDisk: false,
	},
	turbopack: {
		root: __dirname,
	},
	async rewrites() {
		return [unmatchedFileRewrite];
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: securityHeaders,
			},
		];
	},
	images: {
		loader: 'custom',
		loaderFile: './lib/image-loader.ts',
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'image.tmdb.org',
				pathname: '/t/p/**',
			},
			{
				protocol: 'https',
				hostname: supabaseHost,
				pathname: '/storage/v1/object/public/avatars/**',
			},
			{
				protocol: 'https',
				hostname: 'cdn.watchmode.com',
				pathname: '/provider_logos/**',
			},
			{
				protocol: 'https',
				hostname: '*.mzstatic.com',
				pathname: '/**',
			},
		],
	},
};

const offlineRevision = crypto.randomUUID();

const withPWA = withSerwist({
	swSrc: 'app/service-worker.ts',
	swDest: 'public/sw.js',
	disable: isDev,
	reloadOnOnline: false,
	additionalPrecacheEntries: [
		{ url: '/en/offline', revision: offlineRevision },
		{ url: '/fr/offline', revision: offlineRevision },
	],
})(nextConfig);

/**
 * Source maps and the same-origin tunnel. Without the wrapper every Bugsink stack trace reads
 * `chunk-a3f2.js:1:48291`, and events sent straight to the third-party DSN are dropped by
 * ad blockers. Upload is skipped when SENTRY_AUTH_TOKEN is unset, so local builds stay offline.
 */
export default withSentryConfig(withPWA, {
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,
	sentryUrl: process.env.SENTRY_URL,
	authToken: process.env.SENTRY_AUTH_TOKEN,
	tunnelRoute: '/monitoring',
	widenClientFileUpload: true,
	webpack: { treeshake: { removeDebugLogging: true, removeTracing: true } },
	silent: !process.env.CI,
	sourcemaps: { deleteSourcemapsAfterUpload: true },
});
