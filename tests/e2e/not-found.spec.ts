import { test, expect } from '@playwright/test';

test.describe('404 page', () => {
	test('shows not-found page for unknown routes', async ({ page }) => {
		await page.goto('/this-route-does-not-exist-at-all');
		await expect(page.locator('main')).toBeVisible();
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	/**
	 * Un chemin à extension échappe au proxy et tombe dans `[lang]` : le `notFound()` du
	 * layout racine escaladait en 500 (constaté en prod sur `/favicon.ico`).
	 */
	test('an unmatched file path lands on the localized 404, not a 500', async ({
		page,
	}) => {
		for (const path of ['/config.json', '/missing.png', '/foo.xml']) {
			const res = await page.goto(path);
			expect(res?.status(), path).toBeLessThan(500);
			await expect(page.locator('h1'), path).toHaveText(/not found/i);
		}
	});

	test('favicon.ico is served', async ({ request }) => {
		const res = await request.get('/favicon.ico');
		expect(res.status()).toBe(200);
	});

	test('a missing title does not print the brand twice', async ({ page }) => {
		await page.goto('/en/movie/not-a-number');
		await expect(page).toHaveTitle('ReelMark');
	});
});
