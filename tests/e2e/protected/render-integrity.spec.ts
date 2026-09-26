import { test, expect } from '@playwright/test';

/**
 * Un composant qui rend autre chose côté client qu'au serveur (garde `typeof document`
 * dans le rendu) fait jeter le HTML serveur par React (#418) et régénère l'arbre.
 */
const HYDRATED_ROUTES = [
	'/en/library',
	'/en/explorer/popular',
	'/en/movie/550',
	'/en/tv/1399',
	'/en/tv/1399/season/1',
	'/en/crew/287',
];

test.describe('Intégrité du rendu', () => {
	for (const url of HYDRATED_ROUTES) {
		test(`${url} s'hydrate sans mismatch`, async ({ page }) => {
			const hydrationErrors: string[] = [];
			page.on('pageerror', (e) => {
				if (/418|hydrat/i.test(e.message))
					hydrationErrors.push(e.message);
			});
			await page.goto(url, { waitUntil: 'networkidle' });
			expect(hydrationErrors).toEqual([]);
		});
	}

	test('une catégorie héritée du prototype est une 404', async ({ page }) => {
		for (const url of [
			'/en/explorer/constructor',
			'/en/explorer/toString',
		]) {
			await page.goto(url);
			await expect(page.locator('h1'), url).toHaveText(/not found/i);
		}
	});
});
