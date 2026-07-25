import type { Locator, Page } from '@playwright/test';

/** First enabled page-level action button matching `text`, excluding the hover-only buttons nested inside media cards. */
export function pageButton(page: Page, text: RegExp): Locator {
	return page
		.locator('xpath=//button[not(@disabled) and not(ancestor::a)]')
		.filter({ hasText: text })
		.first();
}
