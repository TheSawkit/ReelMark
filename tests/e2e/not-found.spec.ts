import { test, expect } from '@playwright/test';

test.describe('404 page', () => {
	test('shows not-found page for unknown routes', async ({ page }) => {
		await page.goto('/this-route-does-not-exist-at-all');
		await expect(page.locator('main')).toBeVisible();
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});
});
