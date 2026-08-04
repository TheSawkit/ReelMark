import { test, expect, type Page } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

test.describe.configure({ mode: 'serial' });

const TV_ID = 1399;
const SEASON = 1;
const WATCH_LABEL = /^(Mark watched|Watched)$/;

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

function episodeButton(page: Page) {
	return page.getByRole('button', { name: WATCH_LABEL }).first();
}

async function toggleAndSettle(
	page: Page,
	button: ReturnType<typeof episodeButton>
) {
	const before = await button.getAttribute('aria-label');
	await Promise.all([
		page.waitForResponse(
			(resp) =>
				resp.request().method() === 'POST' &&
				resp.request().headers()['next-action'] !== undefined,
			{ timeout: 15000 }
		),
		button.click(),
	]);
	await expect(button).not.toHaveAttribute('aria-label', before!, {
		timeout: 10000,
	});
	return before!;
}

test.describe('Episode watch writes', () => {
	test('toggling an episode flips its state and restores it', async ({
		page,
	}) => {
		await page.goto(`/en/tv/${TV_ID}/season/${SEASON}`);

		const button = episodeButton(page);
		await expect(button).toBeVisible({ timeout: 15000 });

		const initial = await toggleAndSettle(page, button);
		const flipped = await button.getAttribute('aria-label');
		expect(flipped).not.toBe(initial);

		await toggleAndSettle(page, button);
		await expect(button).toHaveAttribute('aria-label', initial, {
			timeout: 10000,
		});
	});

	test('the flipped state survives a reload before being restored', async ({
		page,
	}) => {
		await page.goto(`/en/tv/${TV_ID}/season/${SEASON}`);

		const button = episodeButton(page);
		await expect(button).toBeVisible({ timeout: 15000 });
		const initial = await toggleAndSettle(page, button);

		await page.reload();
		const afterReload = episodeButton(page);
		await expect(afterReload).toBeVisible({ timeout: 15000 });
		await expect(afterReload).not.toHaveAttribute('aria-label', initial, {
			timeout: 10000,
		});

		await toggleAndSettle(page, afterReload);
		await expect(afterReload).toHaveAttribute('aria-label', initial, {
			timeout: 10000,
		});
	});
});
