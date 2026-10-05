import { test, expect } from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const TV_ID = 1408;
const ADD_LABEL = /^Add to list$/;
const ACTIVE_LABEL = /^(Added|Watched)$/;

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

test('removing a show asks first, since it erases the episode history', async ({
	page,
}) => {
	await page.goto(`/en/tv/${TV_ID}`);

	const addButton = page.getByRole('button', { name: ADD_LABEL }).first();
	const activeButton = page
		.getByRole('button', { name: ACTIVE_LABEL })
		.first();
	await expect(addButton.or(activeButton)).toBeVisible({ timeout: 15000 });

	const addedByTest = await addButton.isVisible();
	if (addedByTest) {
		await addButton.click();
		await expect(activeButton).toBeVisible({ timeout: 10000 });
	}

	const dialog = page.getByRole('dialog', { name: /remove this show/i });
	await activeButton.click();
	await expect(dialog).toBeVisible();
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(dialog).toBeHidden();
	await expect(activeButton).toBeVisible();

	if (addedByTest) {
		await activeButton.click();
		await dialog.getByRole('button', { name: 'Remove' }).click();
		await expect(addButton).toBeVisible({ timeout: 10000 });
	}
});
