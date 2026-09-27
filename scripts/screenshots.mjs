/**
 * Captures ReelMark and lays the captures out as the README and PWA-manifest screenshots.
 *
 *   pnpm screenshots
 *
 * Reads `.env.local`. Captures the site at SCREENSHOTS_BASE_URL (production by default). With
 * TEST_USER_EMAIL / TEST_USER_PASSWORD (and the Supabase URL and anon key) it signs in and adds the
 * signed-in pages — home, library, AI assistant; without them it sticks to public pages.
 *
 * Output:
 *   docs/assets/screenshots/{en,fr}-showcase.jpg   three phones, captioned
 *   docs/assets/screenshots/{en,fr}-desktop.jpg    a title page in a browser frame
 *   public/screenshots/*.jpg                       raw captures listed in app/manifest.ts
 *
 * Optional: CHROMIUM_PATH (browser binary), SCREENSHOTS_IGNORE_HTTPS_ERRORS=1 (behind a TLS proxy),
 * SCREENSHOTS_ATTEMPTS (retries per capture, 5 by default).
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from 'dotenv';
import { chromium } from '@playwright/test';
import { createServerClient } from '@supabase/ssr';

config({ path: '.env.local' });

const BASE_URL = (
	process.env.SCREENSHOTS_BASE_URL ?? 'https://reelmark.silexio.be'
).replace(/\/$/, '');
const ROOT = process.cwd();
const SHOWCASE_DIR = path.join(ROOT, 'docs/assets/screenshots');
const MANIFEST_DIR = path.join(ROOT, 'public/screenshots');
const RAW_DIR = path.join(ROOT, 'node_modules/.cache/reelmark-screenshots');

/** iPhone Pro Max: wide enough for every label of the title page to fit on one line. */
const PHONE = { width: 430, height: 932, scale: 3 };
const DESKTOP = { width: 1440, height: 900, scale: 2 };
const ATTEMPTS = Number(process.env.SCREENSHOTS_ATTEMPTS ?? 5);

const MOVIE = '/movie/693134';
const SHOW = '/tv/94605';

const COPY = {
	en: {
		headline: 'Never ask “which episode were we on?” again.',
		tagline: 'Movies and shows, tracked episode by episode.',
		desktop: 'Every title, from where to stream it to who made it.',
		captions: {
			home: 'Picks made for your taste',
			library: 'Your whole library, sorted',
			assistant: 'Plug in your AI assistant',
			movie: 'Every title, in full',
			providers: 'See where to stream it',
			seasons: 'Track every season',
		},
	},
	fr: {
		headline: 'Fini les « on en était à quel épisode ? »',
		tagline: 'Films et séries, suivis épisode par épisode.',
		desktop:
			'Chaque titre, de la plateforme qui le diffuse à ceux qui l’ont fait.',
		captions: {
			home: 'Des suggestions à ton goût',
			library: 'Toute ta bibliothèque, rangée',
			assistant: 'Branche ton assistant IA',
			movie: 'Chaque titre, en grand',
			providers: 'Où le regarder, d’un coup d’œil',
			seasons: 'Chaque saison, chaque épisode',
		},
	},
};

/** Shots per language, in showcase order of preference; `anchor` scrolls a section under the navbar. */
const PHONE_SHOTS = [
	{ key: 'home', path: '/dashboard', signedIn: true },
	{ key: 'movie', path: MOVIE },
	{ key: 'library', path: '/library', signedIn: true },
	{
		key: 'assistant',
		path: '/settings?section=data',
		anchor: '#ai-assistant',
		signedIn: true,
	},
	{ key: 'providers', path: MOVIE, anchor: '#where-to-watch' },
	{ key: 'seasons', path: SHOW, heading: /^(Seasons|Saisons)$/ },
];

async function signInCookies() {
	const email = process.env.TEST_USER_EMAIL;
	const password = process.env.TEST_USER_PASSWORD;
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!email || !password || !url || !anonKey) return null;

	const cookies = [];
	const supabase = createServerClient(url, anonKey, {
		cookies: {
			getAll: () => [],
			setAll: (toSet) =>
				cookies.push(
					...toSet.map(({ name, value }) => ({ name, value }))
				),
		},
	});
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});
	if (error) throw new Error(`Sign-in failed: ${error.message}`);
	const domain = new URL(BASE_URL).hostname;
	return cookies.map(({ name, value }) => ({
		name,
		value,
		domain,
		path: '/',
	}));
}

/** Scrolls a section just under the fixed navbar, then lets scroll-driven reveals settle. */
async function scrollTo(page, { anchor, heading }) {
	const target = anchor
		? page.locator(anchor).first()
		: page.getByRole('heading', { name: heading }).first();
	await target.waitFor({ timeout: 20_000 });
	await target.evaluate((element) =>
		window.scrollTo(
			0,
			element.getBoundingClientRect().top + window.scrollY - 96
		)
	);
	await page.waitForTimeout(1500);
}

/** Throws when the page shows the error screen, a font failed or an image in view is broken, so the capture is retried. */
async function assertPresentable(page) {
	const problem = await page.evaluate(() => {
		// "… Fallback" faces are next/font's local('Arial') metric stand-ins: they error wherever
		// Arial is not installed, which says nothing about the real fonts.
		const failedFont = [...document.fonts].some(
			(font) =>
				font.status === 'error' && !font.family.endsWith(' Fallback')
		);
		if (failedFont) return 'font failed to load';
		if (
			/Something went wrong|Un problème est survenu/.test(
				document.body.innerText
			)
		)
			return 'error screen';
		const broken = [...document.images].filter((image) => {
			const box = image.getBoundingClientRect();
			return (
				box.bottom > 0 &&
				box.top < window.innerHeight &&
				box.width > 0 &&
				image.complete &&
				!image.naturalWidth
			);
		});
		return broken.length ? `${broken.length} broken image(s)` : null;
	});
	if (problem) throw new Error(problem);
}

async function waitForImages(page) {
	await page.evaluate(async () => {
		await document.fonts.ready;
		const inView = [...document.images].filter((image) => {
			const box = image.getBoundingClientRect();
			return box.bottom > 0 && box.top < window.innerHeight;
		});
		await Promise.all(
			inView.map((image) =>
				image.complete
					? null
					: new Promise((done) => {
							image.addEventListener('load', done, {
								once: true,
							});
							image.addEventListener('error', done, {
								once: true,
							});
							setTimeout(done, 10_000);
						})
			)
		);
	});
}

/** Fonts, scripts, styles and images: retried on their own, so one dropped request does not cost a whole page load. */
const STATIC_ASSET =
	/\/_next\/(static|image)\/|\.(woff2?|jpe?g|png|webp|avif|svg)(\?|$)|image\.tmdb\.org|i\.ytimg\.com/;

async function retryRequest(route) {
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			const response = await route.fetch();
			if (response.status() < 500) return route.fulfill({ response });
		} catch {
			// Network failure: try again.
		}
	}
	return route.abort();
}

async function capture(browser, { url, viewport, cookies, scroll, file }) {
	for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
		const context = await browser.newContext({
			viewport: { width: viewport.width, height: viewport.height },
			deviceScaleFactor: viewport.scale,
			isMobile: viewport.width < 600,
			hasTouch: viewport.width < 600,
			colorScheme: 'dark',
			serviceWorkers: 'block',
			ignoreHTTPSErrors:
				process.env.SCREENSHOTS_IGNORE_HTTPS_ERRORS === '1',
		});
		if (cookies) await context.addCookies(cookies);
		await context.route(STATIC_ASSET, retryRequest);
		const page = await context.newPage();
		try {
			await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
			await page.waitForTimeout(2500);
			if (scroll) await scrollTo(page, scroll);
			await waitForImages(page);
			await assertPresentable(page);
			await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
			if (!appFonts) appFonts = await collectFonts(page).catch(() => '');
			await context.close();
			return file;
		} catch (error) {
			console.warn(
				`  ${path.basename(file)}: attempt ${attempt} failed (${error.message.split('\n')[0]})`
			);
			await context.close();
		}
	}
	return null;
}

/** The app's own Inter and Bebas Neue (latin subset), inlined so the layouts need no network. */
let appFonts = '';

async function collectFonts(page) {
	return page.evaluate(async () => {
		const families = ['Inter', 'Bebas Neue'];
		const faces = [];
		for (const sheet of document.styleSheets) {
			let rules;
			try {
				rules = sheet.cssRules;
			} catch {
				continue;
			}
			for (const rule of rules) {
				if (!(rule instanceof CSSFontFaceRule)) continue;
				const family = rule.style
					.getPropertyValue('font-family')
					.replace(/['"]/g, '')
					.trim();
				const range = rule.style.getPropertyValue('unicode-range');
				const src = rule.style
					.getPropertyValue('src')
					.match(/url\("?([^")]+)"?\)/);
				if (!families.includes(family) || !src) continue;
				if (range && !/U\+0+-0*FF\b/i.test(range)) continue;
				const bytes = new Uint8Array(
					await (
						await fetch(
							new URL(src[1], sheet.href ?? location.href)
						)
					).arrayBuffer()
				);
				let binary = '';
				for (let i = 0; i < bytes.length; i += 0x8000)
					binary += String.fromCharCode(
						...bytes.subarray(i, i + 0x8000)
					);
				const weight =
					rule.style.getPropertyValue('font-weight') || '400';
				faces.push(
					`@font-face{font-family:'${family}';font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2')}`
				);
			}
		}
		return faces.join('\n');
	});
}

const dataUrl = async (file) =>
	`data:image/jpeg;base64,${(await readFile(file)).toString('base64')}`;

const pageStyle = () => `
	${appFonts || "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600&display=block');"}
	* { margin: 0; box-sizing: border-box; }
	body {
		width: 1600px; font-family: Inter, system-ui, sans-serif; color: #f5f5f7;
		background:
			radial-gradient(900px 520px at 50% -8%, rgba(185, 9, 11, .55), transparent 70%),
			radial-gradient(700px 500px at 50% 115%, rgba(185, 9, 11, .18), transparent 70%),
			#070707;
	}
	.wordmark { font-family: 'Bebas Neue', Impact, sans-serif; letter-spacing: .02em; text-transform: uppercase; }
	header { text-align: center; padding: 64px 80px 0; }
	header .wordmark { font-size: 40px; color: #fff; opacity: .9; }
	h1 { font-size: 46px; font-weight: 600; letter-spacing: -.02em; margin-top: 10px; }
	header p { font-size: 22px; color: #a1a1aa; margin-top: 12px; }
	figcaption { font-size: 22px; font-weight: 600; text-align: center; margin-top: 26px; }
`;

function showcaseHtml(copy, shots) {
	const phones = shots
		.map(
			({ image, caption }, index) => `
		<figure style="transform: translateY(${index === 1 ? 0 : 44}px) scale(${index === 1 ? 1.06 : 1})">
			<div class="phone"><img src="${image}" alt=""></div>
			<figcaption>${caption}</figcaption>
		</figure>`
		)
		.join('');
	return `<!doctype html><html><head><meta charset="utf-8"><style>${pageStyle()}
		main { display: flex; justify-content: center; align-items: flex-start; gap: 64px; padding: 64px 0 96px; }
		.phone {
			width: 380px; height: 824px; border-radius: 58px; padding: 12px; background: #1b1b1d;
			box-shadow: 0 0 0 2px #2c2c30, 0 40px 90px rgba(0,0,0,.65), 0 0 120px rgba(185,9,11,.22);
		}
		.phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 46px; display: block; }
	</style></head><body>
		<header><div class="wordmark">ReelMark</div><h1>${copy.headline}</h1><p>${copy.tagline}</p></header>
		<main>${phones}</main>
	</body></html>`;
}

function desktopHtml(copy, image) {
	return `<!doctype html><html><head><meta charset="utf-8"><style>${pageStyle()}
		main { padding: 56px 110px 104px; }
		.window { border-radius: 18px; overflow: hidden; background: #161618;
			box-shadow: 0 0 0 1px #2c2c30, 0 50px 110px rgba(0,0,0,.7), 0 0 140px rgba(185,9,11,.2); }
		.bar { height: 46px; display: flex; align-items: center; gap: 9px; padding: 0 18px; background: #1c1c1f; }
		.dot { width: 13px; height: 13px; border-radius: 50%; background: #3a3a3f; }
		.url { margin: 0 auto; padding: 6px 90px; border-radius: 8px; background: #111113; color: #8e8e93; font-size: 15px; }
		.window img { width: 100%; display: block; }
	</style></head><body>
		<header><div class="wordmark">ReelMark</div><h1>${copy.desktop}</h1></header>
		<main><div class="window">
			<div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span>
				<span class="url">${new URL(BASE_URL).host}</span></div>
			<img src="${image}" alt="">
		</div></main>
	</body></html>`;
}

async function render(browser, html, file) {
	const page = await browser.newPage({
		viewport: { width: 1600, height: 900 },
		deviceScaleFactor: 2,
	});
	await page
		.setContent(html, { waitUntil: 'networkidle', timeout: 60_000 })
		.catch(() => {});
	await page.evaluate(() => document.fonts.ready);
	await page.screenshot({
		path: file,
		type: 'jpeg',
		quality: 88,
		fullPage: true,
	});
	await page.close();
}

async function main() {
	await Promise.all(
		[SHOWCASE_DIR, MANIFEST_DIR, RAW_DIR].map((dir) =>
			mkdir(dir, { recursive: true })
		)
	);
	const cookies = await signInCookies();
	console.log(
		cookies
			? 'Signed in: capturing signed-in pages too.'
			: 'No test account: public pages only.'
	);

	const browser = await chromium.launch(
		process.env.CHROMIUM_PATH
			? { executablePath: process.env.CHROMIUM_PATH }
			: {}
	);
	const manifest = [];

	for (const lang of Object.keys(COPY)) {
		const copy = COPY[lang];
		const captured = [];
		for (const shot of PHONE_SHOTS) {
			if (shot.signedIn && !cookies) continue;
			if (captured.length === 3) break;
			const file = path.join(RAW_DIR, `${lang}-${shot.key}.jpg`);
			console.log(`${lang} ${shot.key}`);
			const ok = await capture(browser, {
				url: `${BASE_URL}/${lang}${shot.path}`,
				viewport: PHONE,
				cookies: shot.signedIn ? cookies : null,
				scroll: shot.anchor || shot.heading ? shot : null,
				file,
			});
			if (ok) captured.push({ ...shot, file });
		}
		if (captured.length < 3)
			throw new Error(
				`${lang}: only ${captured.length} phone captures succeeded`
			);

		const phones = await Promise.all(
			captured.map(async ({ key, file }) => ({
				caption: copy.captions[key],
				image: await dataUrl(file),
			}))
		);
		await render(
			browser,
			showcaseHtml(copy, phones),
			path.join(SHOWCASE_DIR, `${lang}-showcase.jpg`)
		);

		const desktopFile = path.join(RAW_DIR, `${lang}-desktop.jpg`);
		console.log(`${lang} desktop`);
		if (
			await capture(browser, {
				url: `${BASE_URL}/${lang}${MOVIE}`,
				viewport: DESKTOP,
				file: desktopFile,
			})
		) {
			await render(
				browser,
				desktopHtml(copy, await dataUrl(desktopFile)),
				path.join(SHOWCASE_DIR, `${lang}-desktop.jpg`)
			);
		}

		if (lang === 'en') {
			for (const { key, file } of captured) {
				await writeFile(
					path.join(MANIFEST_DIR, `${key}.jpg`),
					await readFile(file)
				);
				manifest.push(key);
			}
			await writeFile(
				path.join(MANIFEST_DIR, 'desktop.jpg'),
				await readFile(desktopFile)
			);
		}
	}

	await browser.close();
	console.log(
		`Done. Manifest screenshots: ${[...manifest, 'desktop'].join(', ')} — keep app/manifest.ts in sync.`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
