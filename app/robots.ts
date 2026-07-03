import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/metadata';

const BLOCKED_BOTS = [
	'GPTBot',
	'CCBot',
	'Bytespider',
	'PerplexityBot',
	'ClaudeBot',
	'Claude-Web',
	'Amazonbot',
	'meta-externalagent',
	'FacebookBot',
	'AhrefsBot',
	'SemrushBot',
	'MJ12bot',
	'DotBot',
	'PetalBot',
];

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			...BLOCKED_BOTS.map((userAgent) => ({
				userAgent,
				disallow: '/',
			})),
			{
				userAgent: '*',
				allow: ['/', '/login', '/signup'],
				disallow: ['/dashboard', '/library', '/settings', '/api/'],
			},
		],
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
