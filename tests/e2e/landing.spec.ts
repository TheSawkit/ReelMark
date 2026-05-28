import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
    test('renders hero section', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('main').first()).toBeVisible();
        await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('has link to login page', async ({ page }) => {
        await page.goto('/');
        const loginLink = page
            .getByRole('link', { name: /connexion|login/i })
            .first();
        await expect(loginLink).toBeVisible();
    });

    test('skip-to-main-content link is present', async ({ page }) => {
        await page.goto('/');
        const skipLink = page.getByRole('link', {
            name: /contenu principal|main content/i,
        });
        await expect(skipLink).toBeAttached();
    });
});
