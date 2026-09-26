import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';
import { findGhostControls } from '../../helpers/ghost-controls';

const PAGES = ['/fr/dashboard', '/fr/library', '/fr/movie/550', '/fr/tv/1399'];

const TOUCH_DEVICES = {
	phone: { width: 390, height: 844 },
	'tablet portrait': { width: 820, height: 1180 },
	'foldable unfolded': { width: 960, height: 720 },
};

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

for (const [device, viewport] of Object.entries(TOUCH_DEVICES)) {
	test.describe(`Hover-only controls on touch devices — ${device}`, () => {
		test.use({ viewport, hasTouch: true, isMobile: true });

		test('no invisible control is tappable', async ({ page }) => {
			test.setTimeout(180000);

			for (const path of PAGES) {
				await page.goto(path, { waitUntil: 'domcontentloaded' });
				await page.waitForTimeout(2500);
				expect(await findGhostControls(page), path).toEqual([]);
			}
		});
	});
}
