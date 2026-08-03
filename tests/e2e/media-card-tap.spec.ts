import { test, expect } from '@playwright/test';

test.use({
	viewport: { width: 390, height: 844 },
	hasTouch: true,
	isMobile: true,
});

test.describe('MediaCard on touch devices', () => {
	test('tapping the bottom of a card navigates instead of firing a watchlist action', async ({
		page,
		baseURL,
	}) => {
		// Scoped to our own origin: Sentry ships its envelopes over POST too, and counting
		// those made the assertion fail on a perfectly innocent tap.
		const origin = new URL(baseURL ?? 'http://localhost:3000').origin;
		const serverActions: string[] = [];
		page.on('request', (request) => {
			const url = request.url();
			if (request.method() === 'POST' && url.startsWith(origin))
				serverActions.push(url);
		});

		await page.goto('/en/movie/550');
		// Les rangées de titres similaires arrivent derrière Suspense et poussent la page :
		// choisir une carte avant leur insertion en désigne une autre que celle finalement
		// affichée à cet endroit.
		await page.waitForLoadState('networkidle');

		const card = page.locator('a:has(button)').first();
		await card.scrollIntoViewIfNeeded();
		await expect(card).toBeVisible();

		const href = await card.getAttribute('href');
		const box = await card.boundingBox();
		if (!href || !box) throw new Error('no media card found on the page');

		// Viser la carte plutôt que des coordonnées d'écran : Playwright réancre le point et
		// attend que l'élément soit immobile, là où un tap absolu part sur une mesure périmée
		// dès que quoi que ce soit se réagence au-dessus.
		await card.tap({
			position: { x: box.width / 2, y: box.height * 0.92 },
		});
		await page.waitForTimeout(2000);

		expect(serverActions).toEqual([]);
		expect(new URL(page.url()).pathname).toBe(href);
	});
});
