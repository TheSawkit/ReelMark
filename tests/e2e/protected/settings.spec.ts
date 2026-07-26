import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const SECTIONS = ['profile', 'notifications', 'services', 'data', 'privacy'];

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

test.describe('Settings', () => {
	test('renders instead of the error boundary', async ({ page }) => {
		const pageErrors: string[] = [];
		page.on('pageerror', (error) => pageErrors.push(error.message));

		await page.goto('/fr/settings');

		await expect(
			page.getByRole('button', { name: /Profil|Profile/ }).first()
		).toBeVisible({ timeout: 20_000 });
		await expect(page.getByText('Oups')).toHaveCount(0);
		expect(pageErrors).toEqual([]);
	});

	/** Les CTA renvoient vers `?section=…` : un onglet invalide ou serveur-only casserait la page. */
	for (const section of SECTIONS) {
		test(`opens directly on ?section=${section}`, async ({ page }) => {
			await page.goto(`/fr/settings?section=${section}`);

			await expect(page.getByText('Oups')).toHaveCount(0);
			await expect(
				page.getByRole('button', { name: /Profil|Profile/ }).first()
			).toBeVisible({ timeout: 20_000 });
		});
	}

	test('falls back to the profile tab on an unknown section', async ({
		page,
	}) => {
		await page.goto('/fr/settings?section=nimporte-quoi');

		await expect(page.getByText('Oups')).toHaveCount(0);
		await expect(
			page.getByRole('button', { name: /Profil|Profile/ }).first()
		).toBeVisible({ timeout: 20_000 });
	});
});
