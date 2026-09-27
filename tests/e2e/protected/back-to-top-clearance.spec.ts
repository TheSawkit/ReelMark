import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const PROLIFIC_PERSON_ID = 2231;

/**
 * La flèche de retour en haut était placée à une hauteur fixe : sur un iPhone à encoche la barre
 * d'onglets, remontée par la zone de sécurité, la recouvrait, et sur tablette (barre encore
 * affichée jusqu'à lg) elle passait dessous. Les encoches sont simulées par Chrome DevTools.
 */
const DEVICES = [
	{
		name: 'iPhone à encoche',
		viewport: { width: 390, height: 844 },
		insets: { top: 47, bottom: 34, left: 0, right: 0 },
	},
	{
		name: 'iPhone paysage',
		viewport: { width: 844, height: 390 },
		insets: { top: 0, bottom: 21, left: 47, right: 47 },
	},
	{
		name: 'tablette portrait',
		viewport: { width: 820, height: 1180 },
		insets: { top: 24, bottom: 20, left: 0, right: 0 },
	},
];

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

for (const { name, viewport, insets } of DEVICES) {
	test.describe(`Flèche de retour en haut — ${name}`, () => {
		test.use({ viewport, hasTouch: true, isMobile: true });

		test('reste au-dessus de la barre d’onglets et hors des encoches', async ({
			page,
			context,
		}) => {
			const cdp = await context.newCDPSession(page);
			await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets });

			await page.goto(`/en/crew/${PROLIFIC_PERSON_ID}`);
			await page
				.getByRole('heading', { level: 1 })
				.waitFor({ timeout: 15000 });
			await page.waitForFunction(
				() =>
					document.documentElement.scrollHeight >
					window.innerHeight + 1000,
				undefined,
				{ timeout: 15000 }
			);
			await page.evaluate(() =>
				window.scrollTo({ top: 2000, behavior: 'instant' })
			);

			const button = page.locator('[data-slot="back-to-top-button"]');
			await expect(button).toHaveAttribute('data-state', 'visible');

			const buttonBox = await button.boundingBox();
			const barBox = await page
				.locator('nav.bottom-nav-safe-area .glass-bar')
				.boundingBox();

			expect(buttonBox).not.toBeNull();
			expect(barBox).not.toBeNull();
			expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(
				barBox!.y
			);
			expect(
				viewport.width - (buttonBox!.x + buttonBox!.width)
			).toBeGreaterThanOrEqual(insets.right);
		});
	});
}
