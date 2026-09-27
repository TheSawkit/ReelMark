import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const SLIDE = '[aria-roledescription="slide"]';
const DOT_LABEL = /^(Show slide|Afficher la diapositive) \d+$/;

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

test.describe('Diaporama de la bannière Explorer', () => {
	test('le HTML serveur ne porte qu’une diapositive et une seule image prioritaire', async ({
		page,
	}) => {
		const html = await (await page.request.get('/en/explorer')).text();
		expect(html.match(/aria-roledescription="slide"/g) ?? []).toHaveLength(
			1
		);
		expect(html.match(/fetchPriority="high"/gi) ?? []).toHaveLength(1);
	});

	test('les diapositives suivantes arrivent après le chargement et se pilotent aux points', async ({
		page,
	}) => {
		await page.goto('/en/explorer', { waitUntil: 'load' });

		const dots = page.getByRole('button', { name: DOT_LABEL });
		await expect(dots).toHaveCount(5, { timeout: 15000 });
		await expect(page.locator(SLIDE)).toHaveCount(5);

		const active = page.locator(`${SLIDE}:not([inert])`);
		const firstTitle = await active.locator('h2').textContent();

		await dots.nth(2).click();
		await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
		await expect(active.locator('h2')).not.toHaveText(firstTitle ?? '');
		await expect(page.locator(`${SLIDE}:not([inert])`)).toHaveCount(1);
	});
});
