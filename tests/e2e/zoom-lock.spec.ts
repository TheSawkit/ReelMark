import { test, expect } from '@playwright/test';

/**
 * Le zoom est verrouillé côté produit : pincement et double tap partaient tout seuls
 * pendant le défilement en PWA. Le verrou vit dans `touch-action`, jamais dans
 * `user-scalable` — iOS ignore ce dernier, et le laisser rendrait juste l'audit rouge.
 */
test.describe('Verrou du zoom', () => {
	test('touch-action retire les gestes de zoom sur html et body', async ({
		page,
	}) => {
		await page.goto('/');

		const touchAction = await page.evaluate(() => ({
			html: getComputedStyle(document.documentElement).touchAction,
			body: getComputedStyle(document.body).touchAction,
		}));

		expect(touchAction.html).toBe('pan-x pan-y');
		expect(touchAction.body).toBe('pan-x pan-y');
	});

	test('le viewport ne recourt pas à user-scalable, ignoré par iOS', async ({
		page,
	}) => {
		await page.goto('/');

		const viewport = await page.evaluate(
			() =>
				document
					.querySelector('meta[name="viewport"]')
					?.getAttribute('content') ?? ''
		);

		expect(viewport).toContain('width=device-width');
		expect(viewport).not.toContain('user-scalable');
		expect(viewport).not.toContain('maximum-scale');
	});

	test('les éléments interactifs gardent un touch-action sans double tap', async ({
		page,
	}) => {
		await page.goto('/');

		const linkTouchAction = await page.evaluate(() => {
			const link = document.querySelector('a');
			return link ? getComputedStyle(link).touchAction : null;
		});

		expect(linkTouchAction).toBe('manipulation');
	});
});
