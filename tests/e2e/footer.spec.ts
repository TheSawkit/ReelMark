import { test, expect } from '@playwright/test';

test.describe('Footer', () => {
	test('links "Add to AI" to the AI assistant card of Settings in both languages', async ({
		page,
	}) => {
		for (const [lang, name] of [
			['en', 'Add to AI'],
			['fr', 'Ajouter à l’IA'],
		] as const) {
			await page.goto(`/${lang}/terms`);
			const link = page
				.getByRole('contentinfo')
				.getByRole('link', { name });
			await expect(link).toHaveAttribute(
				'href',
				`/${lang}/settings?section=data#ai-assistant`
			);
		}
	});
});
