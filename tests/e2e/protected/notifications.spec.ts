import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { hasValidAuth } from '../../helpers/auth';

const admin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
	process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

let userId = '';
const sender = `e2e-bell-${Date.now()}`;

async function seedUnread(suffix: string): Promise<void> {
	const { error } = await admin.from('notifications').insert({
		user_id: userId,
		sender_id: userId,
		type: 'friend_request',
		sender_username: `${sender}-${suffix}`,
		url: '/notifications',
	});
	expect(error).toBeNull();
}

function bell(page: Page) {
	return page.getByRole('button', { name: 'Notifications' });
}

async function badgeCount(page: Page): Promise<number> {
	const badge = bell(page).locator('span');
	if ((await badge.count()) === 0) return 0;
	return Number(await badge.textContent());
}

function item(page: Page, suffix: string) {
	return page
		.getByRole('dialog')
		.locator('.group', { hasText: `${sender}-${suffix}` });
}

function serverActionDone(page: Page) {
	return page.waitForResponse(
		(r) => r.request().method() === 'POST' && r.ok()
	);
}

test.beforeAll(async () => {
	test.skip(!hasValidAuth() || !process.env.SUPABASE_SERVICE_ROLE_KEY);
	const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
	expect(error).toBeNull();
	userId =
		data.users.find((u) => u.email === process.env.TEST_USER_EMAIL)?.id ??
		'';
	expect(userId).not.toBe('');
});

test.afterAll(async () => {
	if (userId)
		await admin
			.from('notifications')
			.delete()
			.eq('user_id', userId)
			.like('sender_username', `${sender}%`);
});

test.describe('Cloche de notifications', () => {
	test('une notification reste non lue jusqu’à « marquer comme vu »', async ({
		page,
	}) => {
		await seedUnread('seen');
		await page.goto('/en/dashboard', { waitUntil: 'networkidle' });
		const before = await badgeCount(page);
		expect(before).toBeGreaterThan(0);

		await bell(page).click();
		await item(page, 'seen').getByRole('link').click();
		await page.waitForLoadState('networkidle');
		expect(await badgeCount(page)).toBe(before);

		await page.reload({ waitUntil: 'networkidle' });
		expect(await badgeCount(page)).toBe(before);

		await bell(page).click();
		await Promise.all([
			serverActionDone(page),
			item(page, 'seen')
				.getByRole('button', { name: 'Mark as seen' })
				.click(),
		]);
		await expect.poll(() => badgeCount(page)).toBe(before - 1);

		await page.reload({ waitUntil: 'networkidle' });
		await expect.poll(() => badgeCount(page)).toBe(before - 1);
	});

	test('supprimer une notification non lue met la cloche à jour', async ({
		page,
	}) => {
		await seedUnread('deleted');
		await page.goto('/en/dashboard', { waitUntil: 'networkidle' });
		const before = await badgeCount(page);

		await bell(page).click();
		await Promise.all([
			serverActionDone(page),
			item(page, 'deleted')
				.getByRole('button', { name: 'Delete' })
				.click(),
		]);
		await expect(item(page, 'deleted')).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(before - 1);

		await page.reload({ waitUntil: 'networkidle' });
		await expect.poll(() => badgeCount(page)).toBe(before - 1);
	});

	test('une notification arrivée pendant que l’app était en arrière-plan apparaît au retour', async ({
		page,
	}) => {
		await page.routeWebSocket(/realtime/, () => {});
		await page.goto('/en/dashboard', { waitUntil: 'networkidle' });
		const before = await badgeCount(page);

		await page.evaluate(() => {
			Object.defineProperty(document, 'visibilityState', {
				value: 'hidden',
				configurable: true,
			});
		});
		await seedUnread('background');
		await page.evaluate(() => {
			Object.defineProperty(document, 'visibilityState', {
				value: 'visible',
				configurable: true,
			});
			document.dispatchEvent(new Event('visibilitychange'));
		});

		await expect.poll(() => badgeCount(page)).toBe(before + 1);
	});
});
