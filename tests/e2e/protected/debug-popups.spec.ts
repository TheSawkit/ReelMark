import { test, expect } from '@playwright/test';

test.describe('visual: mobile bottom tab bar', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('captures bottom tab bar glass', async ({ page }) => {
		await page.goto('/en/explorer');
		await page.waitForLoadState('networkidle');
		await page.mouse.wheel(0, 600);
		await page.waitForTimeout(800);
		await page.screenshot({
			path: 'test-results/visual-bottombar.png',
			clip: { x: 0, y: 684, width: 390, height: 160 },
		});
	});
});

const EPISODE_BTN =
	'button[aria-label="Mark watched"], button[aria-label="Watched"]';

test('episode toggle is optimistic and does not reload the page', async ({
	page,
}) => {
	await page.goto('/en/tv/615/season/1');
	await page.waitForLoadState('networkidle');

	let reloads = 0;
	page.on('load', () => reloads++);

	const btn = page.locator(EPISODE_BTN).first();
	const before = await btn.getAttribute('aria-label');
	const after = before === 'Watched' ? 'Mark watched' : 'Watched';

	await btn.click();
	await expect(btn).toHaveAttribute('aria-label', after, { timeout: 1200 });
	await page.waitForTimeout(2000);
	await page.keyboard.press('Escape');
	await page.waitForTimeout(400);
	console.log('TOGGLE 1 OK:', before, '→', after, '| reloads:', reloads);
	expect(reloads).toBe(0);

	await btn.click();
	await expect(btn).toHaveAttribute('aria-label', before ?? '', {
		timeout: 1200,
	});
	await page.waitForTimeout(2000);
	await page.keyboard.press('Escape');
	console.log('TOGGLE 2 OK (state restored) | reloads:', reloads);
	expect(reloads).toBe(0);
});
