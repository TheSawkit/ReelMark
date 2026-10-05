import { test, expect } from '@playwright/test';

test.describe('Service worker', () => {
	test('is registered when the browser allows it', async ({ page }) => {
		await page.goto('/en', { waitUntil: 'load' });
		await expect
			.poll(
				() =>
					page.evaluate(async () =>
						Boolean(
							(await navigator.serviceWorker.getRegistration())
								?.active
						)
					),
				{ timeout: 15_000 }
			)
			.toBe(true);
	});

	/** @serwist/window 9.5 lit `registration.waiting` sur un enregistrement refusé : l'erreur partait non gérée vers Bugsink. */
	test('leaves no unhandled error when the browser refuses it', async ({
		browser,
	}) => {
		const context = await browser.newContext({ serviceWorkers: 'block' });
		const page = await context.newPage();
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));

		await page.goto('/en', { waitUntil: 'load' });
		await page.waitForTimeout(1_000);

		expect(errors).toEqual([]);
		await context.close();
	});
});
