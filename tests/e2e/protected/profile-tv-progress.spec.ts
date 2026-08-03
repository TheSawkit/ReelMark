import { test, expect, type Page } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

async function getOwnProfileHref(page: Page): Promise<string | null> {
	await page.goto('/en/dashboard');
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

test.describe('Profile watchlist — TV progress bar', () => {
	test('series cards carry a progress bar bounded to their episode total', async ({
		page,
	}) => {
		const href = await getOwnProfileHref(page);
		if (!href) test.skip(true, 'Could not find profile link in user menu');

		await page.goto(href!);

		const seriesFilter = page
			.getByRole('button', { name: /^(séries|series)/i })
			.first();
		await seriesFilter.waitFor({ state: 'visible', timeout: 10000 });
		await seriesFilter.click();

		const seriesCard = page.locator('a[href*="/tv/"]').first();
		if ((await seriesCard.count()) === 0)
			test.skip(true, 'No TV show in the test account watchlist');
		await seriesCard.scrollIntoViewIfNeeded();

		const fill = seriesCard.locator('div.h-1 > div').first();
		await expect(fill).toBeAttached({ timeout: 10000 });

		const width = await fill.evaluate(
			(node) => (node as HTMLElement).style.width
		);
		const percent = Number.parseInt(width, 10);
		expect(percent).toBeGreaterThanOrEqual(0);
		expect(percent).toBeLessThanOrEqual(100);
	});
});
