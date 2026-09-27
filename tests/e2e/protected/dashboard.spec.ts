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

	test('does not redirect to login when authenticated', async ({ page }) => {
		await page.goto('/en/dashboard');
		await expect(page).not.toHaveURL(/\/login/);
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
