import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

test.describe.configure({ mode: 'serial' });

const MOVIE_ID = 550;
const MOVIE_TITLE = 'Fight Club';

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

async function clickAndWaitForAction(
	page: import('@playwright/test').Page,
	locator: import('@playwright/test').Locator
) {
	const responsePromise = page.waitForResponse(
		(resp) =>
			resp.request().method() === 'POST' &&
			resp.request().headers()['next-action'] !== undefined,
		{ timeout: 10000 }
	);
	await locator.click();
	await responsePromise;
}

test.describe('Watchlist', () => {
	test('add and remove a movie from watchlist', async ({ page }) => {
		await page.goto(`/movie/${MOVIE_ID}`);
		await expect(page.getByRole('heading', { level: 1 })).toContainText(
			MOVIE_TITLE,
			{ timeout: 10000 }
		);

		// If movie is in "watched" state, clicking it falls back to "to_watch" (fallbackStatus="to_watch")
		const watchedActiveBtn = page
			.locator('button:not([disabled])')
			.filter({ hasText: /^vu$|^watched$/i })
			.first();
		if (await watchedActiveBtn.isVisible()) {
			await clickAndWaitForAction(page, watchedActiveBtn);
			await expect(
				page
					.locator('button:not([disabled])')
					.filter({ hasText: /^ajouté$|^added$/i })
					.first()
			).toBeVisible({ timeout: 5000 });
		}

		// If movie is in "to_watch" state, remove it entirely
		const addedBtn = page
			.locator('button:not([disabled])')
			.filter({ hasText: /^ajouté$|^added$/i })
			.first();
		if (await addedBtn.isVisible()) {
			await clickAndWaitForAction(page, addedBtn);
			await expect(
				page
					.locator('button:not([disabled])')
					.filter({ hasText: /ajouter à la liste|add to list/i })
					.first()
			).toBeVisible({ timeout: 5000 });
		}

		const addBtn = page
			.locator('button:not([disabled])')
			.filter({ hasText: /ajouter à la liste|add to list/i })
			.first();
		await clickAndWaitForAction(page, addBtn);

		await page.goto('/library');
		await expect(page.getByText(MOVIE_TITLE)).toBeVisible({
			timeout: 10000,
		});

		await page.goto(`/movie/${MOVIE_ID}`);
		await clickAndWaitForAction(
			page,
			page
				.locator('button:not([disabled])')
				.filter({ hasText: /^ajouté$|^added$/i })
				.first()
		);

		await page.goto('/library');
		await expect(page.getByText(MOVIE_TITLE)).not.toBeVisible();
	});

	test('mark a movie as watched and unmark', async ({ page }) => {
		await page.goto(`/movie/${MOVIE_ID}`);
		await expect(page.getByRole('heading', { level: 1 })).toContainText(
			MOVIE_TITLE,
			{ timeout: 10000 }
		);

		const watchedBtn = page
			.locator('button:not([disabled])')
			.filter({ hasText: /^vu$|^watched$/i })
			.first();
		if (await watchedBtn.isVisible()) {
			await clickAndWaitForAction(page, watchedBtn);
			await expect(
				page
					.locator('button:not([disabled])')
					.filter({ hasText: /marquer comme vu|mark as watched/i })
					.first()
			).toBeVisible({ timeout: 5000 });
		}

		await clickAndWaitForAction(
			page,
			page
				.locator('button:not([disabled])')
				.filter({ hasText: /marquer comme vu|mark as watched/i })
				.first()
		);

		await page.goto('/library');
		await page.getByRole('tab', { name: /regardés|watched/i }).click();
		await expect(page.getByText(MOVIE_TITLE)).toBeVisible({
			timeout: 10000,
		});
		await page.goto(`/movie/${MOVIE_ID}`);
		await expect(
			page
				.locator('button:not([disabled])')
				.filter({ hasText: /^vu$|^watched$/i })
				.first()
		).toBeVisible({ timeout: 5000 });
		await clickAndWaitForAction(
			page,
			page
				.locator('button:not([disabled])')
				.filter({ hasText: /^vu$|^watched$/i })
				.first()
		);
		await expect(
			page
				.locator('button:not([disabled])')
				.filter({ hasText: /^vu$|^watched$/i })
				.first()
		).not.toBeVisible({ timeout: 5000 });
	});
});
