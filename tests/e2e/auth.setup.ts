import { test as setup } from '@playwright/test';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

const authFile = path.join(process.cwd(), 'tests/.auth/user.json');

async function writeEmptyAuth() {
	await mkdir(path.dirname(authFile), { recursive: true });
	await writeFile(authFile, JSON.stringify({ cookies: [], origins: [] }));
}

setup('authenticate', async ({ page }) => {
	const email = process.env.TEST_USER_EMAIL;
	const password = process.env.TEST_USER_PASSWORD;

	if (!email || !password) {
		await writeEmptyAuth();
		return;
	}

	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/login');
	await page.locator('#email').fill(email);
	await page.locator('#password').fill(password);
	await page
		.getByRole('button', { name: /connexion|login|se connecter/i })
		.click();

	const navigated = await page
		.waitForURL('/dashboard', { timeout: 15000 })
		.then(() => true)
		.catch(() => false);

	if (!navigated) {
		await writeEmptyAuth();
		return;
	}

	await page.context().storageState({ path: authFile });
});
