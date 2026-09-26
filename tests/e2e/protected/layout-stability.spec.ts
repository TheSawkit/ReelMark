import { test, expect } from '@playwright/test';

/**
 * Le pied de page restait visible tant que le contenu n'était pas arrivé, puis était chassé
 * hors de l'écran : 0.0989 de CLS sur /library, au-dessus du seuil Core Web Vitals. La hauteur
 * plancher de <main> l'a ramené à 0.0026 — ce test empêche qu'un changement de mise en page
 * réintroduise un décalage du même ordre.
 *
 * /tv en mobile montait à 0.11 : le badge de certification faisait passer les métadonnées sur
 * deux lignes et le bouton de lecture arrivait après coup. La ligne de métadonnées défile
 * désormais sur une seule ligne et le bandeau réserve la place du bouton (« où regarder »
 * tant que les offres ne sont pas résolues).
 */
const BUDGET = 0.05;

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

const SCREENS = [
	{ path: '/en/library', viewport: DESKTOP },
	{ path: '/en/explorer', viewport: DESKTOP },
	{ path: '/en/dashboard', viewport: DESKTOP },
	{ path: '/en/movie/550', viewport: DESKTOP },
	{ path: '/en/tv/1399', viewport: PHONE },
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
	for (const { path, viewport } of SCREENS) {
		test(`${path} (${viewport.width}px) reste sous ${BUDGET} de CLS`, async ({
			page,
		}) => {
			await page.setViewportSize(viewport);
			expect(await measureCls(page, path)).toBeLessThan(BUDGET);
		});
	}
});
