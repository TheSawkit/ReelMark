import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { APPLE_SPLASH_SCREENS } from '@/lib/pwa-splash-screens';

describe('APPLE_SPLASH_SCREENS', () => {
	it('declares a portrait and a landscape image per device', () => {
		const orientations = APPLE_SPLASH_SCREENS.map((screen) =>
			screen.url.endsWith('_portrait.png') ? 'portrait' : 'landscape'
		);
		expect(APPLE_SPLASH_SCREENS).toHaveLength(44);
		expect(orientations.filter((o) => o === 'portrait')).toHaveLength(22);
		expect(orientations.filter((o) => o === 'landscape')).toHaveLength(22);
	});

	it('matches every media query to its own orientation', () => {
		for (const { url, media } of APPLE_SPLASH_SCREENS) {
			const orientation = url.endsWith('_portrait.png')
				? 'portrait'
				: 'landscape';
			expect(media).toContain(`(orientation: ${orientation})`);
			expect(media).toMatch(
				/^\(device-width: \d+px\) and \(device-height: \d+px\) and \(-webkit-device-pixel-ratio: \d+\)/
			);
		}
	});

	it('points at a file that actually ships in public/splash', () => {
		const missing = APPLE_SPLASH_SCREENS.map(({ url }) => url).filter(
			(url) => !existsSync(join(process.cwd(), 'public', url))
		);
		expect(missing).toEqual([]);
	});
});
