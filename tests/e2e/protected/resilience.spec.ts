import { test, expect, type Page } from '@playwright/test';
import { pageButton } from '../../helpers/controls';

/** Le bouton de la frontière d'erreur (`ErrorCard`) — présent seulement si la page a planté. */
function errorBoundary(page: Page) {
	return page.getByRole('button', { name: /try again|réessayer/i });
}

test.describe('Résilience de rendu', () => {
	test('le dashboard rend au lieu de la frontière d erreur', async ({
		page,
	}) => {
		const pageErrors: string[] = [];
		page.on('pageerror', (e) => pageErrors.push(e.message));

		const res = await page.goto('/en/dashboard', {
			waitUntil: 'networkidle',
		});
		expect(res?.status()).toBeLessThan(400);

		await expect(errorBoundary(page)).toHaveCount(0);
		await expect(page.locator('main')).toBeVisible();
		expect(pageErrors).toEqual([]);
	});

	test('le dashboard survit à des rechargements successifs immédiats', async ({
		page,
	}) => {
		for (let attempt = 1; attempt <= 4; attempt++) {
			const res = await page.goto('/en/dashboard', {
				waitUntil: 'domcontentloaded',
			});
			expect(res?.status(), `passage ${attempt}`).toBeLessThan(400);
			await expect(errorBoundary(page), `passage ${attempt}`).toHaveCount(
				0
			);
		}
	});

	/**
	 * Un id TMDB inexistant renvoie 404 depuis la couche cachée. L'erreur ne doit pas
	 * traverser la frontière `"use cache"` sous forme digérée, sinon elle emporte le rendu
	 * complet malgré le try/catch de l'appelant.
	 */
	test('une fiche au TMDB id inexistant ne casse pas le rendu', async ({
		page,
	}) => {
		for (const url of ['/en/tv/99999999', '/en/movie/99999999']) {
			const res = await page.goto(url, {
				waitUntil: 'domcontentloaded',
			});
			expect(res?.status(), url).toBeLessThan(500);
		}
	});

	/** L'utilisateur enchaîne les actions à moins d'une seconde d'intervalle. */
	test('des actions watchlist rapprochées laissent le dashboard sain', async ({
		page,
	}) => {
		await page.goto('/en/movie/550', { waitUntil: 'domcontentloaded' });

		// Les actions arrivent derrière Suspense : sans cette attente, le `isVisible()` de la
		// boucle répond false au premier tour et le test sort sans avoir cliqué une seule fois.
		await expect(
			pageButton(page, /watch|vu|ajout|added|list/i)
		).toBeVisible({ timeout: 15000 });

		for (let i = 0; i < 3; i++) {
			const button = pageButton(page, /watch|vu|ajout|added|list/i);
			if (!(await button.isVisible().catch(() => false))) break;
			await button.click({ timeout: 5000 }).catch(() => {});
			await page.waitForTimeout(250);
		}

		// `domcontentloaded`, pas `networkidle` : le tableau de bord charge des affiches en
		// continu et n'atteint le silence réseau qu'au-delà du budget du test. Les assertions
		// qui suivent patientent déjà d'elles-mêmes.
		const res = await page.goto('/en/dashboard', {
			waitUntil: 'domcontentloaded',
		});
		expect(res?.status()).toBeLessThan(400);
		await expect(errorBoundary(page)).toHaveCount(0);
		await expect(page.locator('main')).toBeVisible();
	});
});
