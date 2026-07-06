import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';

const isDev = process.env.NODE_ENV === 'development';
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
	`connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://www.youtube.com${isDev ? ' ws: wss:' : ' wss:'}`,
	"object-src 'none'",
	"base-uri 'self'",
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
	experimental: {
		optimizePackageImports: [
			'lucide-react',
			'@radix-ui/react-dialog',
			'@radix-ui/react-dropdown-menu',
			'@radix-ui/react-label',
			'@radix-ui/react-separator',
			'@radix-ui/react-slot',
		],
		viewTransition: true,
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
		formats: ['image/webp'],
		minimumCacheTTL: 2678400,
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

export default withSerwist({
	swSrc: 'app/service-worker.ts',
	swDest: 'public/sw.js',
	disable: isDev,
})(nextConfig);
