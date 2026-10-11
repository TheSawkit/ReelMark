import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { hasValidAuth } from '../../helpers/auth';

const admin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
	process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

let userId = '';
const SENDER_PREFIX = 'e2e-bell-';
const sender = `${SENDER_PREFIX}${Date.now()}`;
let seeded = 0;

async function seedUnread(): Promise<{ id: string; label: string }> {
	const label = `${sender}-${++seeded}`;
	const { data, error } = await admin
		.from('notifications')
		.insert({
			user_id: userId,
			sender_id: userId,
			type: 'friend_request',
			sender_username: label,
			url: '/notifications',
		})
		.select('id')
		.single();
	expect(error).toBeNull();
	return { id: data!.id, label };
}

const LEFTOVER_AGE_MS = 60 * 60 * 1000;

async function deleteSeeded(senderPattern: string, createdBefore?: Date) {
	let query = admin
		.from('notifications')
		.delete()
		.eq('user_id', userId)
		.like('sender_username', senderPattern);
	if (createdBefore)
		query = query.lt('created_at', createdBefore.toISOString());
	await query;
}

function bell(page: Page) {
	return page.getByRole('button', { name: 'Notifications' });
}

async function badgeCount(page: Page): Promise<number> {
	const badge = bell(page).locator('span');
	if ((await badge.count()) === 0) return 0;
	const count = Number(await badge.textContent());
	if (Number.isNaN(count))
		throw new Error(
			'The bell shows "9+": the test account holds too many unread notifications to count them, clean it up.'
		);
	return count;
}

function item(page: Page, label: string) {
	return page.getByRole('dialog').locator('.group', { hasText: label });
}

function pageItem(page: Page, label: string) {
	return page.getByRole('main').locator('.group', { hasText: label });
}

function actionOn(page: Page, notificationId: string) {
	return page.waitForResponse(
		(r) =>
			r.request().method() === 'POST' &&
			r.request().headers()['next-action'] !== undefined &&
			(r.request().postData() ?? '').includes(notificationId) &&
			r.ok()
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
	await deleteSeeded(
		`${SENDER_PREFIX}%`,
		new Date(Date.now() - LEFTOVER_AGE_MS)
	);
});

test.afterEach(async () => {
	if (userId) await deleteSeeded(`${sender}%`);
});

test.describe('Cloche de notifications', () => {
	test('une notification reste non lue jusqu’à « marquer comme vu »', async ({
		page,
	}) => {
		const seen = await seedUnread();
		await page.goto('/en/dashboard', { waitUntil: 'networkidle' });
		const before = await badgeCount(page);
		expect(before).toBeGreaterThan(0);

		await bell(page).click();
		await item(page, seen.label).getByRole('link').click();
		await page.waitForLoadState('networkidle');
		expect(await badgeCount(page)).toBe(before);

		await page.reload({ waitUntil: 'networkidle' });
		expect(await badgeCount(page)).toBe(before);

		await bell(page).click();
		await Promise.all([
			actionOn(page, seen.id),
			item(page, seen.label)
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
		const deleted = await seedUnread();
		await page.goto('/en/dashboard', { waitUntil: 'networkidle' });
		const before = await badgeCount(page);

		await bell(page).click();
		await Promise.all([
			actionOn(page, deleted.id),
			item(page, deleted.label)
				.getByRole('button', { name: 'Delete' })
				.click(),
		]);
		await expect(item(page, deleted.label)).toHaveCount(0);
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
		await seedUnread();
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

async function openNotificationsPage(page: Page) {
	await page.goto('/en/dashboard', { waitUntil: 'networkidle' });
	await bell(page).click();
	await page.getByRole('link', { name: 'See all' }).click();
	await page.waitForURL('**/en/notifications');
}

test.describe('Page des notifications', () => {
	test('« marquer comme vu » est enregistré et met la cloche à jour', async ({
		page,
	}) => {
		const seen = await seedUnread();
		await openNotificationsPage(page);
		const before = await badgeCount(page);
		expect(before).toBeGreaterThan(0);
		const markAsSeen = pageItem(page, seen.label).getByRole('button', {
			name: 'Mark as seen',
		});

		await Promise.all([actionOn(page, seen.id), markAsSeen.click()]);
		await expect(markAsSeen).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(before - 1);

		await page.reload();
		await expect(pageItem(page, seen.label)).toHaveCount(1);
		await expect(markAsSeen).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(before - 1);
	});

	test('une notification supprimée ne revient pas au rechargement', async ({
		page,
	}) => {
		const kept = await seedUnread();
		const deleted = await seedUnread();
		await openNotificationsPage(page);
		const before = await badgeCount(page);
		expect(before).toBeGreaterThan(0);

		await Promise.all([
			actionOn(page, deleted.id),
			pageItem(page, deleted.label)
				.getByRole('button', { name: 'Delete' })
				.click(),
		]);
		await expect(pageItem(page, deleted.label)).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(before - 1);

		await page.reload();
		await expect(pageItem(page, kept.label)).toHaveCount(1);
		await expect(pageItem(page, deleted.label)).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(before - 1);
	});
});

test.describe('Page des notifications — échec et cohérence avec la cloche', () => {
	test('une suppression qui échoue remet la notification et prévient', async ({
		page,
	}) => {
		const kept = await seedUnread();
		await openNotificationsPage(page);
		const before = await badgeCount(page);
		expect(before).toBeGreaterThan(0);

		await page.route('**/en/notifications', (route) =>
			(route.request().postData() ?? '').includes(kept.id)
				? route.abort()
				: route.continue()
		);
		await pageItem(page, kept.label)
			.getByRole('button', { name: 'Delete' })
			.click();

		await expect(page.getByText('Error — try again')).toBeVisible();
		await expect(pageItem(page, kept.label)).toHaveCount(1);
		await expect.poll(() => badgeCount(page)).toBe(before);
	});

	test('une notification marquée vue dans le panneau l’est aussi dans la page, décomptée une seule fois', async ({
		page,
	}) => {
		const seen = await seedUnread();
		await openNotificationsPage(page);
		const before = await badgeCount(page);
		expect(before).toBeGreaterThan(0);
		const markAsSeenInPage = pageItem(page, seen.label).getByRole(
			'button',
			{
				name: 'Mark as seen',
			}
		);
		await expect(markAsSeenInPage).toHaveCount(1);

		await bell(page).click();
		await Promise.all([
			actionOn(page, seen.id),
			item(page, seen.label)
				.getByRole('button', { name: 'Mark as seen' })
				.click(),
		]);

		await expect(markAsSeenInPage).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(before - 1);
	});

	test('une notification arrivée pendant qu’on est sur une autre page apparaît en revenant', async ({
		page,
	}) => {
		await seedUnread();
		await openNotificationsPage(page);
		await page.goBack();
		await page.waitForURL('**/en/dashboard');

		const arrived = await seedUnread();
		await bell(page).click();
		await page.getByRole('link', { name: 'See all' }).click();
		await page.waitForURL('**/en/notifications');

		await expect(pageItem(page, arrived.label)).toHaveCount(1);
	});

	test('« tout marquer comme vu » vide la cloche et tient au rechargement', async ({
		page,
	}) => {
		const firstSeen = await seedUnread();
		const secondSeen = await seedUnread();
		await openNotificationsPage(page);
		expect(await badgeCount(page)).toBeGreaterThan(1);

		await page.getByRole('button', { name: 'Mark all as seen' }).click();

		for (const seen of [firstSeen, secondSeen])
			await expect(
				pageItem(page, seen.label).getByRole('button', {
					name: 'Mark as seen',
				})
			).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(0);

		await page.reload();
		await expect(pageItem(page, firstSeen.label)).toHaveCount(1);
		await expect(
			page.getByRole('main').getByRole('button', { name: 'Mark as seen' })
		).toHaveCount(0);
		await expect.poll(() => badgeCount(page)).toBe(0);
	});
});
