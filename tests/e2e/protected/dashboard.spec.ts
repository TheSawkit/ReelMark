import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

test.describe('Dashboard', () => {
	test('loads and is accessible', async ({ page }) => {
		await page.goto('/en/dashboard');
		await expect(page).toHaveURL('/en/dashboard');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
			timeout: 10000,
		});
	});

	test('the landing sends a signed-in visitor to the dashboard with one HTTP redirect', async ({
		page,
	}) => {
		const res = await page.request.get('/en', { maxRedirects: 0 });
		expect(res.status()).toBe(307);
		expect(res.headers().location).toMatch(/\/en\/dashboard$/);
	});

	test('does not redirect to login when authenticated', async ({ page }) => {
		await page.goto('/en/dashboard');
		await expect(page).not.toHaveURL(/\/login/);
	});

	/** Un flou par carte = une couche GPU par carte : le dashboard en empilait 172 (kill mémoire WebKit mobile). */
	test('cards repeated in the rows carry no backdrop-filter', async ({
		page,
	}) => {
		await page.goto('/en/dashboard');
		await expect(page.locator('.snap-start').first()).toBeVisible({
			timeout: 20000,
		});
		const blurredInCards = await page.evaluate(
			() =>
				[...document.querySelectorAll('.snap-start *')].filter((el) => {
					const style = getComputedStyle(el);
					return (
						style.backdropFilter !== 'none' ||
						(style.webkitBackdropFilter ?? 'none') !== 'none'
					);
				}).length
		);
		expect(blurredInCards).toBe(0);
	});

	test('explains why each "For You" title is suggested', async ({ page }) => {
		await page.goto('/en/dashboard');
		const heading = page.getByRole('heading', {
			name: 'For You',
			exact: true,
		});
		test.skip(
			!(await heading
				.waitFor({ state: 'visible', timeout: 20000 })
				.then(() => true)
				.catch(() => false)),
			'Test account has no "For You" row'
		);
		await expect(
			page.getByText(/^Because (you|.+ is on your list)/).first()
		).toBeVisible();
	});
});

test.describe('Explorer', () => {
	test('loads with media content', async ({ page }) => {
		await page.goto('/en/explorer');
		await expect(page).toHaveURL('/en/explorer');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
			timeout: 10000,
		});
		await expect(page.locator('img').first()).toBeVisible({
			timeout: 15000,
		});
	});

	test('search is one tap away', async ({ page }) => {
		await page.goto('/en/explorer');
		await expect(
			page
				.getByRole('button', { name: /^search$/i })
				.filter({ visible: true })
				.first()
		).toBeVisible({ timeout: 10000 });
	});
});

test.describe('Library', () => {
	test('loads and is accessible', async ({ page }) => {
		await page.goto('/en/library');
		await expect(page).toHaveURL('/en/library');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
			timeout: 10000,
		});
	});

	test('shows movie/tv tabs', async ({ page }) => {
		await page.goto('/en/library');
		await expect(
			page
				.getByRole('link', { name: /movie|film/i })
				.or(page.getByRole('tab'))
				.first()
		).toBeVisible({ timeout: 10000 });
	});
});
