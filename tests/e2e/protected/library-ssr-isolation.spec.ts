import { test, expect, type Browser } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { hasValidAuth } from '../../helpers/auth';

const admin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
	process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);
const FIXTURE_MEDIA_ID = 99_999_999;

async function markupWithoutScripts(
	browser: Browser,
	html: string
): Promise<string> {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const parsed = await context.newPage();
	await parsed.setContent(html, { waitUntil: 'domcontentloaded' });
	const markup = await parsed.evaluate(() => {
		for (const script of document.querySelectorAll('script'))
			script.remove();
		return document.documentElement.outerHTML;
	});
	await context.close();
	return markup;
}

test.beforeEach(() => {
	test.skip(!hasValidAuth() || !process.env.SUPABASE_SERVICE_ROLE_KEY);
});

/**
 * Le store de la bibliothèque est un module partagé par toutes les requêtes du serveur :
 * la première bibliothèque rendue était resservie en SSR aux requêtes suivantes, y compris
 * à d'autres utilisateurs, jusqu'au redémarrage du pod.
 */
test('le HTML de /library reflète la requête en cours, pas une précédente', async ({
	page,
	browser,
}) => {
	const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
	const userId =
		data.users.find((u) => u.email === process.env.TEST_USER_EMAIL)?.id ??
		'';
	const title = `SSR isolation ${Date.now()}`;

	await page.goto('/en/library', { waitUntil: 'networkidle' });

	const { error } = await admin.from('watchlist').insert({
		user_id: userId,
		media_id: FIXTURE_MEDIA_ID,
		media_type: 'movie',
		media_title: title,
		status: 'to_watch',
	});
	expect(error).toBeNull();

	try {
		const html = await (await page.request.get('/en/library')).text();
		const renderedMarkup = await markupWithoutScripts(browser, html);
		expect(renderedMarkup).toContain(title);
	} finally {
		await admin
			.from('watchlist')
			.delete()
			.eq('user_id', userId)
			.eq('media_id', FIXTURE_MEDIA_ID);
	}
});
