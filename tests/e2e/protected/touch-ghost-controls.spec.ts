import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';
import { findGhostControls } from '../../helpers/ghost-controls';

const PAGES = ['/fr/dashboard', '/fr/library', '/fr/movie/550', '/fr/tv/1399'];

test.use({
	viewport: { width: 390, height: 844 },
	hasTouch: true,
	isMobile: true,
});

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

test.describe('Hover-only controls on touch devices', () => {
	test('no invisible control is tappable', async ({ page }) => {
		test.setTimeout(180000);

		for (const path of PAGES) {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			await page.waitForTimeout(2500);
			expect(await findGhostControls(page), path).toEqual([]);
		}
	});
});
