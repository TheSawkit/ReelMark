import { networkInterfaces } from 'node:os';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';

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
	"img-src 'self' data: blob: https://image.tmdb.org https://i.ytimg.com https://lh3.googleusercontent.com https://api.dicebear.com https://*.supabase.co https://cdn.watchmode.com https://*.mzstatic.com",
	"font-src 'self' data: https://fonts.gstatic.com",
	'frame-src https://www.youtube.com https://www.youtube-nocookie.com',
	`connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://www.youtube.com https://sentry.silexio.be${isDev ? ' ws: wss:' : ' wss:'}`,
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

const nextConfig: NextConfig = {
	output: 'standalone',
	cacheComponents: true,
	allowedDevOrigins: localNetworkOrigins(),
	experimental: {
		optimizePackageImports: [
			'lucide-react',
			'simple-icons',
			'@radix-ui/react-dialog',
			'@radix-ui/react-dropdown-menu',
			'@radix-ui/react-label',
			'@radix-ui/react-separator',
			'@radix-ui/react-slot',
		],
		staleTimes: {
			dynamic: 90,
			static: 180,
		},
	},
	turbopack: {
		root: __dirname,
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
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'api.dicebear.com',
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
	webpack: { treeshake: { removeDebugLogging: true } },
	silent: !process.env.CI,
	sourcemaps: { deleteSourcemapsAfterUpload: true },
});
