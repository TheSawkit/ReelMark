import { test, expect } from '@playwright/test';

test.use({
	viewport: { width: 390, height: 844 },
	hasTouch: true,
	isMobile: true,
});

test.describe('MediaCard on touch devices', () => {
	test('tapping the bottom of a card navigates instead of firing a watchlist action', async ({
		page,
	}) => {
		const serverActions: string[] = [];
		page.on('request', (request) => {
			if (request.method() === 'POST') serverActions.push(request.url());
		});

		await page.goto('/en/movie/550');
		const card = page.locator('a:has(button)').first();
		await card.scrollIntoViewIfNeeded();
		await expect(card).toBeVisible();

		const href = await card.getAttribute('href');
		const box = await card.boundingBox();
		if (!href || !box) throw new Error('no media card found on the page');

		await page.touchscreen.tap(
			box.x + box.width / 2,
			box.y + box.height * 0.92
		);
		await page.waitForTimeout(2000);

		expect(serverActions).toEqual([]);
		expect(new URL(page.url()).pathname).toBe(href);
	});
});
