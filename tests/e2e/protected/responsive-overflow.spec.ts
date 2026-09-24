import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const DEVICES = {
	'phone narrow (Fold folded)': { width: 344, height: 882, touch: true },
	'phone landscape': { width: 852, height: 393, touch: true },
	'foldable 4:3 unfolded': { width: 960, height: 720, touch: true },
	'tablet portrait': { width: 820, height: 1180, touch: true },
	'desktop ultrawide': { width: 2560, height: 1080, touch: false },
};

const PAGES = [
	'/en/dashboard',
	'/en/library',
	'/en/explorer',
	'/en/movie/550',
	'/en/tv/1399/season/1',
	'/en/notifications',
];

test.beforeEach(() => {
	test.skip(!hasValidAuth(), 'No valid auth session');
});

for (const [device, { width, height, touch }] of Object.entries(DEVICES)) {
	test.describe(`Aucun débordement horizontal — ${device}`, () => {
		test.use({ viewport: { width, height }, hasTouch: touch });

		test('les pages principales tiennent dans la largeur', async ({
			page,
		}) => {
			test.setTimeout(120000);
			for (const path of PAGES) {
				await page.goto(path, { waitUntil: 'networkidle' });
				const overflow = await page.evaluate(
					() =>
						document.scrollingElement!.scrollWidth -
						document.documentElement.clientWidth
				);
				expect(overflow, path).toBeLessThanOrEqual(1);
			}
		});
	});
}
