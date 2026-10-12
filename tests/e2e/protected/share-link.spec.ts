import { test, expect, type Locator, type Page } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const MOVIE_ID = 550;
const LONG_SEASON_TV_ID = 1408;
const EPISODE_BEYOND_FIRST_BLOCK = 18;

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

async function withoutShareSheet(page: Page) {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'share', {
			value: undefined,
			configurable: true,
		});
	});
}

async function withShareSheet(page: Page) {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'share', {
			value: async (link: { title: string; url: string }) => {
				document.documentElement.dataset.shared = JSON.stringify(link);
			},
			configurable: true,
		});
	});
}

async function shareThrough(
	page: Page,
	button: Locator
): Promise<{ title: string; url: string }> {
	let shared: string | null = null;
	await expect(async () => {
		await button.click();
		shared = await page.evaluate(
			() => document.documentElement.dataset.shared ?? null
		);
		expect(shared).not.toBeNull();
	}).toPass({ timeout: 15000 });
	return JSON.parse(shared!);
}

function heroShareButton(page: Page) {
	return page.locator('.hero-stage').getByRole('button', { name: 'Share' });
}

test.describe('Partage d’un lien', () => {
	test('sans feuille de partage, la fiche d’un film copie son lien', async ({
		page,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await withoutShareSheet(page);
		await page.goto(`/en/movie/${MOVIE_ID}`);

		await expect(async () => {
			await heroShareButton(page).click();
			await expect(page.getByText('Link copied')).toBeVisible({
				timeout: 1000,
			});
		}).toPass({ timeout: 15000 });
		const copied = await page.evaluate(() =>
			navigator.clipboard.readText()
		);
		expect(copied).toMatch(new RegExp(`/movie/${MOVIE_ID}$`));
	});

	test('avec une feuille de partage, la fiche lui confie le titre et le lien', async ({
		page,
	}) => {
		await withShareSheet(page);
		await page.goto(`/en/movie/${MOVIE_ID}`);

		const link = await shareThrough(page, heroShareButton(page));
		expect(link.title).toBe('Fight Club');
		expect(link.url).toMatch(new RegExp(`/movie/${MOVIE_ID}$`));
		await expect(page.getByText('Link copied')).toHaveCount(0);
	});

	test('la série et la saison partagent chacune leur propre page', async ({
		page,
	}) => {
		await withShareSheet(page);

		await page.goto(`/en/tv/${LONG_SEASON_TV_ID}`);
		const show = await shareThrough(page, heroShareButton(page));
		expect(show.url).toMatch(new RegExp(`/tv/${LONG_SEASON_TV_ID}$`));

		await page.goto(`/en/tv/${LONG_SEASON_TV_ID}/season/1`);
		const season = await shareThrough(page, heroShareButton(page));
		expect(season.url).toMatch(
			new RegExp(`/tv/${LONG_SEASON_TV_ID}/season/1$`)
		);
	});

	test('un épisode partage un lien vers sa carte dans la saison', async ({
		page,
	}) => {
		await withShareSheet(page);
		await page.goto(`/en/tv/${LONG_SEASON_TV_ID}/season/1`);

		const episode = await shareThrough(
			page,
			page.locator('#episode-2').getByRole('button', { name: 'Share' })
		);

		expect(episode.url).toMatch(
			new RegExp(`/tv/${LONG_SEASON_TV_ID}/season/1#episode-2$`)
		);
	});

	test('ouvrir le lien d’un épisode affiche sa carte, même au-delà du premier bloc', async ({
		page,
	}) => {
		await page.goto(
			`/en/tv/${LONG_SEASON_TV_ID}/season/1#episode-${EPISODE_BEYOND_FIRST_BLOCK}`
		);

		await expect(
			page.locator(`#episode-${EPISODE_BEYOND_FIRST_BLOCK}`)
		).toBeInViewport({ timeout: 15000 });
	});

	test('le profil partage son propre lien', async ({ page }) => {
		await withShareSheet(page);
		await page.goto('/en/dashboard');
		await page.getByRole('button', { name: 'User menu' }).click();
		await page.getByRole('menuitem', { name: 'My Profile' }).click();
		await page.waitForURL('**/en/profile/*');

		const profile = await shareThrough(
			page,
			page.getByRole('main').getByRole('button', { name: 'Share' })
		);

		const profilePath = new URL(page.url()).pathname.replace(/^\/en/, '');
		expect(new URL(profile.url).pathname).toBe(profilePath);
	});

	test('sur grand écran, le partage d’une fiche fait face au bouton retour', async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/en/movie/${MOVIE_ID}`);
		const share = heroShareButton(page);
		const back = page
			.locator('.hero-stage')
			.getByRole('button', { name: 'Go back' });
		await expect(share).toBeVisible();

		const shareBox = await share.boundingBox();
		const backBox = await back.boundingBox();

		expect(shareBox).not.toBeNull();
		expect(backBox).not.toBeNull();
		expect(Math.abs(shareBox!.y - backBox!.y)).toBeLessThan(2);
		expect(shareBox!.x).toBeGreaterThan(backBox!.x + 600);
	});
});
