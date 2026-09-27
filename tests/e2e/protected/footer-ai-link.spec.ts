import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

test.describe('Footer "Add to AI"', () => {
	test('opens the AI assistant card of Settings', async ({ page }) => {
		await page.goto('/fr/terms');
		const link = page
			.getByRole('contentinfo')
			.getByRole('link', { name: 'Ajouter à l’IA' });
		await expect(link).toHaveAttribute(
			'href',
			'/fr/settings?section=data#ai-assistant'
		);

		await link.click();
		await expect(page).toHaveURL(/section=data#ai-assistant$/);
		await expect(page.locator('#ai-assistant')).toBeInViewport();
	});
});
