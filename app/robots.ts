import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/metadata';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';
import { PROTECTED_SEGMENTS } from '@/lib/proxy/auth-routing';

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
				allow: '/',
				disallow: [
					...SUPPORTED_LANGUAGES.flatMap((lang) =>
						PROTECTED_SEGMENTS.map(
							(segment) => `/${lang}${segment}`
						)
					),
					'/api/',
				],
			},
		],
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
