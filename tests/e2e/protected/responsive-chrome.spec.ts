import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

/** Les barres de navigation mobile et le bandeau ont chacun un bouton retour : un seul doit être visible, quelle que soit la largeur. */
const WIDTHS = [390, 852, 1024, 1280];

test.beforeEach(() => {
	test.skip(!hasValidAuth(), 'No valid auth session');
});

for (const width of WIDTHS) {
	test(`un seul bouton retour visible sur une fiche à ${width}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 800 });
		await page.goto('/en/movie/550', { waitUntil: 'networkidle' });
		const visibleBackButtons = await page
			.getByRole('button', { name: 'Go back' })
			.evaluateAll(
				(buttons) =>
					buttons.filter(
						(button) =>
							button.checkVisibility({ opacityProperty: true }) &&
							button.getBoundingClientRect().height > 0 &&
							!button.closest('[inert]')
					).length
			);
		expect(visibleBackButtons).toBe(1);
	});
}
