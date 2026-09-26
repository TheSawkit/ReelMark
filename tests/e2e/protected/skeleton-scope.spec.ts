import { test, expect } from '@playwright/test';

/**
 * React sort d'une frontière Suspense tout contenu terminé de plus de 12,8 Ko et affiche d'abord
 * le squelette de la frontière parente : le `loading.tsx` racine faisait apparaître le squelette de
 * la landing sur le Dashboard ou une fiche crew, celui de la série sur une saison. Chaque page ou
 * squelette est désormais isolé dans un groupe de routes ; JS coupé, le shell servi doit montrer le
 * squelette de la page demandée, jamais celui d'une autre.
 */
const CASES = [
	{ path: '/en/dashboard', foreign: ['home'] },
	{ path: '/en/crew/287', foreign: ['home'] },
	{ path: '/en/tv/1399/season/1', foreign: ['home', 'tv'] },
	{ path: '/en/tv/1399/similar', foreign: ['home', 'tv'] },
	{ path: '/en/movie/550/similar', foreign: ['home', 'movie'] },
	{ path: '/en/explorer/trending', foreign: ['home', 'explorer'] },
];

test.describe('Portée des squelettes', () => {
	test.use({ javaScriptEnabled: false });

	for (const { path, foreign } of CASES) {
		test(`${path} ne montre que son propre squelette`, async ({ page }) => {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			for (const name of foreign) {
				await expect(
					page.locator(`[data-skeleton="${name}"]:visible`)
				).toHaveCount(0);
			}
		});
	}
});
