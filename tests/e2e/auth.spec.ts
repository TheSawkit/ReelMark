import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
	test('renders login form', async ({ page }) => {
		await page.goto('/en/login');
		await expect(page.locator('[data-slot="card-title"]')).toBeVisible();
		await expect(
			page.getByRole('textbox', { name: /email/i })
		).toBeVisible();
		await expect(
			page.getByRole('button', { name: /^(connexion|login|sign in)$/i })
		).toBeVisible();
	});

	test('shows validation error on empty submit', async ({ page }) => {
		await page.goto('/en/login');
		await page
			.getByRole('button', { name: /^(connexion|login|sign in)$/i })
			.click();
		const emailInput = page.getByRole('textbox', { name: /email/i });
		const validationMessage = await emailInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage
		);
		expect(validationMessage).not.toBe('');
	});
});

test.describe('Signup page', () => {
	test('renders signup form', async ({ page }) => {
		await page.goto('/en/signup');
		await expect(
			page.getByRole('textbox', { name: /email/i })
		).toBeVisible();
		await expect(
			page.getByRole('button', {
				name: /inscription|signup|créer|create/i,
			})
		).toBeVisible();
	});
});
