import { test, expect, type Page } from '@playwright/test';

const IPHONE_SAFARI =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const IPHONE_CHROME =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1';

const ANDROID_CHROME =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const phone = { viewport: { width: 390, height: 844 }, isMobile: true };

const banner = (page: Page) =>
	page.getByRole('region', { name: 'Install ReelMark' });

/**
 * Headless Chromium never fires `beforeinstallprompt`, so replay it the moment the app
 * subscribes — dispatching on a timer would race the hydration that attaches the listener.
 */
async function replayInstallabilityEvent(page: Page) {
	await page.addInitScript(() => {
		const attach = window.addEventListener.bind(window);
		window.addEventListener = (
			type: string,
			listener: EventListenerOrEventListenerObject,
			options?: boolean | AddEventListenerOptions
		) => {
			attach(type, listener, options);
			if (type === 'beforeinstallprompt')
				setTimeout(() => window.dispatchEvent(new Event(type)), 0);
		};
	});
}

test.describe('Install prompt — iPhone on Safari', () => {
	test.use({ ...phone, userAgent: IPHONE_SAFARI });

	test('spells out the Share then Home Screen gesture, with no install button', async ({
		page,
	}) => {
		await page.goto('/en');

		await expect(banner(page)).toBeVisible({ timeout: 10_000 });
		await expect(banner(page)).toContainText('In Safari:');
		await expect(banner(page)).toContainText('Share');
		await expect(banner(page)).toContainText('Home Screen');
		await expect(
			banner(page).getByRole('button', { name: 'Install' })
		).toHaveCount(0);
	});
});

test.describe('Install prompt — iPhone on another browser', () => {
	test.use({ ...phone, userAgent: IPHONE_CHROME });

	test('sends the user back to Safari instead of a gesture it cannot perform', async ({
		page,
	}) => {
		await page.goto('/en');

		await expect(banner(page)).toBeVisible({ timeout: 10_000 });
		await expect(banner(page)).toContainText('Open ReelMark in Safari');
		await expect(banner(page)).not.toContainText('Home Screen');
	});
});

test.describe('Install prompt — Android', () => {
	test.use({ ...phone, userAgent: ANDROID_CHROME });

	test('offers the native install button once the browser announces it', async ({
		page,
	}) => {
		await replayInstallabilityEvent(page);
		await page.goto('/en');

		await expect(banner(page)).toBeVisible({ timeout: 10_000 });
		await expect(
			banner(page).getByRole('button', { name: 'Install' })
		).toBeVisible();
		await expect(banner(page)).not.toContainText('Safari');
	});

	test('stays hidden until the browser announces the app is installable', async ({
		page,
	}) => {
		await page.goto('/en');
		await page.waitForTimeout(5000);

		await expect(banner(page)).toHaveCount(0);
	});
});

test.describe('Install prompt — desktop', () => {
	test('never shows up, since there is no home screen to add to', async ({
		page,
	}) => {
		await page.goto('/en');
		await page.waitForTimeout(5000);

		await expect(banner(page)).toHaveCount(0);
	});
});
