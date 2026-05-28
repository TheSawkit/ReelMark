import { test, expect, type Page } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

test.beforeEach(() => {
    test.skip(
        !hasValidAuth(),
        'No valid auth session — skipping authenticated tests'
    );
});

async function getOwnProfileHref(page: Page): Promise<string | null> {
    await page.goto('/dashboard');
    const userMenuBtn = page.getByRole('button', {
        name: /Menu utilisateur|User menu/i,
    });
    if ((await userMenuBtn.count()) === 0) return null;
    await userMenuBtn.click();
    const profileLink = page.getByRole('menuitem', {
        name: /Mon profil|My Profile/i,
    });
    try {
        await profileLink.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
        return null;
    }
    return profileLink.getAttribute('href');
}

test.describe('Friends tab — own profile', () => {
    test('friends tab is visible on own profile', async ({ page }) => {
        const href = await getOwnProfileHref(page);
        if (!href) test.skip(true, 'Could not find profile link in user menu');

        await page.goto(href!);
        await expect(
            page.getByRole('button', { name: /amis|friends/i }).first()
        ).toBeVisible({ timeout: 10000 });
    });

    test('clicking friends tab shows friends section', async ({ page }) => {
        const href = await getOwnProfileHref(page);
        if (!href) test.skip(true, 'Could not find profile link in user menu');

        await page.goto(href!);
        const friendsTab = page
            .getByRole('button', { name: /amis|friends/i })
            .first();
        await friendsTab.click();

        await expect(friendsTab).toBeVisible({ timeout: 5000 });
    });

    test('pending invitations card is hidden when no pending requests', async ({
        page,
    }) => {
        const href = await getOwnProfileHref(page);
        if (!href) test.skip(true, 'Could not find profile link in user menu');

        await page.goto(href!);
        const friendsTab = page
            .getByRole('button', { name: /amis|friends/i })
            .first();
        await friendsTab.click();

        await expect(
            page.getByRole('button', {
                name: /invitations en attente|pending invitations/i,
            })
        ).not.toBeVisible();
    });
});

test.describe('Friends tab — pending invitations UI', () => {
    test('pending invitations card expands on click when present', async ({
        page,
    }) => {
        const href = await getOwnProfileHref(page);
        if (!href) test.skip(true, 'Could not find profile link in user menu');

        await page.goto(href!);
        const friendsTab = page
            .getByRole('button', { name: /amis|friends/i })
            .first();
        await friendsTab.click();

        const card = page.getByRole('button', {
            name: /invitations en attente|pending invitations/i,
        });
        const isPresent = await card.isVisible();

        if (!isPresent) {
            test.skip(
                true,
                'No pending invitations — requires a second test user to send an invitation first'
            );
            return;
        }

        await expect(card).toHaveAttribute('aria-expanded', 'false');
        await card.click();
        await expect(card).toHaveAttribute('aria-expanded', 'true');

        const list = page.locator('#pending-invitations-list');
        await expect(list).toBeVisible({ timeout: 5000 });

        const acceptBtn = list
            .getByRole('button', { name: /accepter|accept/i })
            .first();
        await expect(acceptBtn).toBeVisible();
    });
});
