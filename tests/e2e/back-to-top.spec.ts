import { test, expect } from '@playwright/test';

const PROLIFIC_PERSON_ID = 2231;

test.describe('Back-to-top button on InfiniteScroll views', () => {
	test('appears after scroll and returns the window to the top', async ({
		page,
	}) => {
		await page.goto(`/en/crew/${PROLIFIC_PERSON_ID}`);
		await page
			.getByRole('heading', { level: 1 })
			.waitFor({ timeout: 15000 });

		const button = page.locator('[data-slot="back-to-top-button"]');
		await expect(button).toHaveAttribute('data-state', 'hidden');

		await page.waitForFunction(
			() =>
				document.documentElement.scrollHeight >
				window.innerHeight + 1000,
			undefined,
			{ timeout: 15000 }
		);
		await expect
			.poll(
				() =>
					page.evaluate(() => {
						window.scrollTo({ top: 2000, behavior: 'instant' });
						return window.scrollY;
					}),
				{ timeout: 5000 }
			)
			.toBeGreaterThan(300);
		await expect(button).toHaveAttribute('data-state', 'visible');

		await button.click();

		await expect
			.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
			.toBeLessThan(50);
		await expect(button).toHaveAttribute('data-state', 'hidden');
	});
});
