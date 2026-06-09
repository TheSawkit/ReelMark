import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const SEED_MOVIE_ID = 603;

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

async function ensureLibraryHasItem(page: import('@playwright/test').Page) {
	await page.goto(`/en/movie/${SEED_MOVIE_ID}`);
	await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 10000 });
	const addBtn = page
		.locator('button:not([disabled])')
		.filter({ hasText: /ajouter à la liste|add to list/i })
		.first();
	if (await addBtn.isVisible().catch(() => false)) {
		const response = page.waitForResponse(
			(resp) =>
				resp.request().method() === 'POST' &&
				resp.request().headers()['next-action'] !== undefined,
			{ timeout: 10000 }
		);
		await addBtn.click();
		await response.catch(() => {});
	}
}

test.describe('Library sort & filter controls', () => {
	test('sort direction persists across reload', async ({ page }) => {
		await ensureLibraryHasItem(page);
		await page.goto('/en/library');

		await expect(
			page.getByRole('button', { name: 'Descending order' })
		).toBeVisible({ timeout: 10000 });

		await page.getByRole('button', { name: 'Descending order' }).click();

		await expect(
			page.getByRole('button', { name: 'Ascending order' })
		).toBeVisible();

		await page.reload();

		await expect(
			page.getByRole('button', { name: 'Ascending order' })
		).toBeVisible({ timeout: 8000 });
	});
});
