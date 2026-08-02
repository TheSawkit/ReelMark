import { test, expect } from '@playwright/test';

/**
 * La transition d'écran translate `.screen-enter`, ce qui en fait le bloc englobant de ses
 * descendants `position: fixed` le temps de l'animation : un tel élément se retrouve ancré au
 * document au lieu du viewport et disparaît de l'écran. MediaActionsBar et BackToTopButton ont
 * été portés dans le body pour ça — ce test empêche qu'un nouveau `fixed` réintroduise le bug.
 */
const SCREENS = ['/en/dashboard', '/en/explorer', '/en/library', '/en/movie/550'];

test.describe("Transition d'écran", () => {
	for (const path of SCREENS) {
		test(`aucun position:fixed sous #main-content sur ${path}`, async ({
			page,
		}) => {
			await page.goto(path);
			await page.waitForLoadState('domcontentloaded');

			const offenders = await page.evaluate(() => {
				const main = document.getElementById('main-content');
				if (!main) return ['#main-content introuvable'];
				return [...main.querySelectorAll('*')]
					.filter((el) => getComputedStyle(el).position === 'fixed')
					.map(
						(el) =>
							`${el.tagName}.${String(el.className || '').split(' ').slice(0, 3).join('.')}`
					);
			});

			expect(offenders).toEqual([]);
		});
	}

	test("la transition se rejoue sur une navigation client et se termine opaque", async ({
		page,
	}) => {
		await page.goto('/en/dashboard');
		await page.waitForLoadState('domcontentloaded');

		await page.evaluate(() => {
			const el = document.querySelector('.screen-enter');
			if (el) (el as HTMLElement).dataset.mark = 'before-nav';
		});

		await page.getByRole('link', { name: /explore/i }).first().click();
		await page.waitForURL('**/en/explorer');

		const screen = page.locator('.screen-enter');
		await expect(screen).toHaveCount(1);
		await expect(screen).not.toHaveAttribute('data-mark', 'before-nav');
		await expect(screen).toHaveCSS('opacity', '1');
		// `backwards` rend la main au style de base une fois l'animation finie : pas de matrice
		// résiduelle, donc pas de bloc englobant permanent pour les `position: fixed`.
		await expect(screen).toHaveCSS('transform', 'none');
	});
});
