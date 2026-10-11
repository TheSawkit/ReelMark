import { test, expect, type Page } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const GLASS =
	'.glass-surface, .glass-bar, .glass-popover, .glass-overlay, .glass-overlay-button';
const SCROLLED_PX = 200;

test.use({
	viewport: { width: 390, height: 844 },
	hasTouch: true,
	isMobile: true,
});

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

async function glassAncestorsFadingOpacity(page: Page): Promise<number> {
	return page.evaluate((glassSelector) => {
		const stage = document.querySelector('.hero-stage');
		if (!stage) return -1;

		let fading = 0;
		for (const glass of stage.querySelectorAll(glassSelector)) {
			let ancestor = glass.parentElement;
			while (ancestor && stage.contains(ancestor)) {
				const animatesOpacity = ancestor
					.getAnimations()
					.some((animation) =>
						(animation.effect as KeyframeEffect)
							.getKeyframes()
							.some((keyframe) => 'opacity' in keyframe)
					);
				if (
					animatesOpacity ||
					getComputedStyle(ancestor).opacity !== '1'
				)
					fading++;
				ancestor = ancestor.parentElement;
			}
		}
		return fading;
	}, GLASS);
}

async function scrollPage(page: Page) {
	await page.evaluate(
		(top) => window.scrollTo({ top, behavior: 'instant' }),
		SCROLLED_PX
	);
}

for (const path of ['/en/movie/550', '/en/tv/1399']) {
	test(`${path} : les boutons en verre du héros gardent leur flou au défilement`, async ({
		page,
	}) => {
		await page.goto(path);
		await expect(
			page
				.locator('.hero-stage')
				.locator(GLASS)
				.locator('visible=true')
				.first()
		).toBeVisible({ timeout: 15000 });

		expect(await glassAncestorsFadingOpacity(page)).toBe(0);

		await scrollPage(page);

		expect(await glassAncestorsFadingOpacity(page)).toBe(0);
	});
}

test('un héros sans verre garde son fondu au défilement', async ({ page }) => {
	await page.goto('/en/dashboard');
	const heroContent = page.locator('.hero-scroll-fade').first();
	await expect(heroContent).toBeVisible({ timeout: 15000 });
	test.skip(
		!(await page.evaluate(() =>
			CSS.supports('animation-timeline: scroll()')
		)),
		'Scroll-driven animations unsupported by this browser'
	);

	await scrollPage(page);

	await expect
		.poll(() =>
			heroContent.evaluate((element) =>
				Number(getComputedStyle(element).opacity)
			)
		)
		.toBeLessThan(1);
});
