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

/**
 * Waits for the movie to appear in the "watched" tab of the library.
 *
 * Les mutations revalident via `after()`, donc APRÈS la réponse de la Server Action : un test
 * qui navigue aussitôt peut devancer la revalidation et tomber sur la page encore en cache.
 * On recharge donc jusqu'à convergence au lieu d'attendre sur un seul rendu.
 */
async function expectInWatchedTab(page: import('@playwright/test').Page) {
	await expect(async () => {
		await page.goto('/en/library');
		await page.getByRole('tab', { name: /regardés|watched/i }).click();
		await expect(page.getByText(MOVIE_TITLE).first()).toBeVisible({
			timeout: 3000,
		});
	}).toPass({ timeout: 20000 });
}

/** Best-effort isolation: drive the movie back to "not in watchlist" before each test (re-navigates each pass to avoid stale handles). */
async function ensureMovieRemoved(page: import('@playwright/test').Page) {
	for (let pass = 0; pass < 3; pass++) {
		await page.goto(`/en/movie/${MOVIE_ID}`);
		await page
			.getByRole('heading', { level: 1 })
			.waitFor({ timeout: 10000 });
		const active = page
			.locator('button:not([disabled])')
			.filter({ hasText: /^vu$|^watched$|^ajouté$|^added$/i })
			.first();
		if (!(await active.isVisible().catch(() => false))) return;
		await clickAndWaitForAction(page, active).catch(() => {});
	}
}

test.beforeEach(async ({ page }) => {
	await ensureMovieRemoved(page);
});

test.describe('Watchlist', () => {
	test('add and remove a movie from watchlist', async ({ page }) => {
		await page.goto(`/en/movie/${MOVIE_ID}`);
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

		await page.goto('/en/library');
		await expect(page.getByText(MOVIE_TITLE)).toBeVisible({
			timeout: 10000,
		});

		await page.goto(`/en/movie/${MOVIE_ID}`);
		await clickAndWaitForAction(
			page,
			page
				.locator('button:not([disabled])')
				.filter({ hasText: /^ajouté$|^added$/i })
				.first()
		);

		await page.goto('/en/library');
		await expect(page.getByText(MOVIE_TITLE)).not.toBeVisible();
	});

	test('mark a movie as watched and unmark', async ({ page }) => {
		await page.goto(`/en/movie/${MOVIE_ID}`);
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

		await expectInWatchedTab(page);
		await page.goto(`/en/movie/${MOVIE_ID}`);
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
				.filter({ hasText: /marquer comme vu|mark as watched/i })
				.first()
		).toBeVisible({ timeout: 10000 });
	});
});
