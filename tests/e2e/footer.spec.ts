import { test, expect } from '@playwright/test';

test.describe('Footer', () => {
	test('hides "Add to AI" from signed-out visitors', async ({ page }) => {
		for (const lang of ['en', 'fr'] as const) {
			await page.goto(`/${lang}/terms`);
			const footer = page.getByRole('contentinfo');
			await expect(
				footer.getByRole('link', { name: /support|soutenir/i })
			).toBeVisible();
			await expect(
				footer.getByRole('link', { name: /Add to AI|Ajouter à l’IA/ })
			).toHaveCount(0);
		}
	});
});
