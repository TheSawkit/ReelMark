import { describe, it, expect, vi } from 'vitest';

const captureException = vi.hoisted(() => vi.fn());
vi.mock('@sentry/nextjs', () => ({ captureException }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => {} }));

const { reportSwallowed } = await import('@/lib/report');

describe('reportSwallowed', () => {
	/** Bugsink groupe par transaction : un repli identique ouvrait une issue par page (126 « fetch failed »). */
	it('groups a fallback by label and message, whatever the page it happened on', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		reportSwallowed(
			'watchmode:app-store-icons',
			new TypeError('fetch failed')
		);

		expect(captureException).toHaveBeenCalledWith(expect.any(TypeError), {
			level: 'warning',
			tags: { label: 'watchmode:app-store-icons' },
			fingerprint: [
				'swallowed',
				'watchmode:app-store-icons',
				'fetch failed',
			],
		});
	});
});
