import { test, expect } from '@playwright/test';

const DONATION_URL = 'https://revolut.me/sawkit17';

test.describe('Support page', () => {
	test('exposes the donation link as an external button', async ({
		page,
	}) => {
		await page.goto('/en/support');
		await expect(
			page.getByRole('heading', { level: 1, name: /support reelmark/i })
		).toBeVisible();

		const donate = page.getByRole('link', { name: /donate/i }).first();
		await expect(donate).toBeVisible();
		await expect(donate).toHaveAttribute('href', DONATION_URL);
		await expect(donate).toHaveAttribute('target', '_blank');
		await expect(donate).toHaveAttribute('rel', /noopener/);
	});

	test('is reachable from the footer in both languages', async ({ page }) => {
		for (const [lang, name] of [
			['en', /support/i],
			['fr', /soutenir/i],
		] as const) {
			await page.goto(`/${lang}`);
			const link = page
				.getByRole('contentinfo')
				.getByRole('link', { name });
			await expect(link).toHaveAttribute('href', `/${lang}/support`);
		}
	});
});
