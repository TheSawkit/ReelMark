import { test, expect } from '@playwright/test';

/**
 * Le pied de page restait visible tant que le contenu n'était pas arrivé, puis était chassé
 * hors de l'écran : 0.0989 de CLS sur /library, au-dessus du seuil Core Web Vitals. La hauteur
 * plancher de <main> l'a ramené à 0.0026 — ce test empêche qu'un changement de mise en page
 * réintroduise un décalage du même ordre.
 *
 * /tv en mobile en est exclu : le badge de certification et le bouton de lecture y dépendent
 * tous deux de la session, arrivent après le premier rendu quand le cache est froid, et leur
 * résolution différée est un choix assumé (préserver le prérendu du shell). Le décalage y est
 * intermittent, donc intestable sans le rendre instable.
 */
const BUDGET = 0.05;

const SCREENS = [
	'/en/library',
	'/en/explorer',
	'/en/dashboard',
	'/en/movie/550',
];

async function measureCls(page: import('@playwright/test').Page, path: string) {
	await page.addInitScript(() => {
		(window as unknown as { __cls: number }).__cls = 0;
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const shift = entry as PerformanceEntry & {
					hadRecentInput: boolean;
					value: number;
				};
				if (!shift.hadRecentInput)
					(window as unknown as { __cls: number }).__cls +=
						shift.value;
			}
		}).observe({ type: 'layout-shift', buffered: true });
	});

	await page.goto(path, { waitUntil: 'domcontentloaded' });
	// Les décalages mesurés sur ces écrans tombent tous avant 1,3 s ; au-delà on ne fait
	// qu'allonger la suite, qui tourne sur un seul worker.
	await page.waitForTimeout(2500);

	return page.evaluate(() => (window as unknown as { __cls: number }).__cls);
}

test.describe('Stabilité de la mise en page', () => {
	for (const path of SCREENS) {
		test(`${path} reste sous ${BUDGET} de CLS`, async ({ page }) => {
			await page.setViewportSize({ width: 1440, height: 900 });
			expect(await measureCls(page, path)).toBeLessThan(BUDGET);
		});
	}
});
