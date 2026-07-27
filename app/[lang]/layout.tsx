import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import '@/app/globals.css';
import { Suspense } from 'react';
import Navbar from '@/components/navigation/Navbar';
import { NavbarFallback } from '@/components/navigation/NavbarFallback';
import { PageTopGradient } from '@/components/navigation/PageTopGradient';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/app/providers';
import { getTranslations } from '@/lib/i18n/server';
import { SUPPORTED_LANGUAGES, isLanguage } from '@/lib/i18n/config';
import type { Language } from '@/lib/i18n/translations';
import { notFound } from 'next/navigation';
import { BASE_URL, DEFAULT_OG_IMAGE } from '@/lib/metadata';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { PreventImageContextMenu } from '@/components/shared/PreventImageContextMenu';
import { PromptSlot } from '@/components/prompts/PromptSlot';
import { SupportBadge } from '@/components/support/SupportBadge';
import NextTopLoader from 'nextjs-toploader';
import Link from 'next/link';
import { localizedHref } from '@/lib/i18n/utils';

/** Stamped at build time: a copyright year must not depend on when a page happens to render. */
const COPYRIGHT_YEAR = new Date().getFullYear();

const sans = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-sans',
});

const display = Bebas_Neue({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-display',
});

// Le pincement pour zoomer reste ouvert : le verrouiller échoue au critère WCAG 1.4.4 et
// prive les malvoyants d'agrandir. Le zoom iOS au focus, seule raison de le verrouiller, ne
// se déclenche pas ici — les champs sont en `text-base` (16 px) sur mobile.
export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
	interactiveWidget: 'resizes-content',
	colorScheme: 'dark light',
	themeColor: [
		{ media: '(prefers-color-scheme: dark)', color: '#000000' },
		{ media: '(prefers-color-scheme: light)', color: '#F5F5F7' },
	],
};

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	title: {
		default: 'ReelMark — Track Movies & TV Shows',
		template: '%s | ReelMark',
	},
	description:
		'Your personal companion to track and organize all the movies, shows and content you have already watched.',
	applicationName: 'ReelMark',
	// Safari enveloppe de lui-même dates, numéros et adresses dans des <a>. Il réécrit donc
	// le DOM entre l'arrivée du HTML et l'hydratation, et React échoue au remplacement d'une
	// frontière Suspense (HierarchyRequestError + erreur #418) — uniquement sur Safari.
	// Les libellés du projet en sont truffés : « S9E1 », « 134/164 épisodes », dates, notes.
	formatDetection: {
		telephone: false,
		date: false,
		address: false,
		email: false,
	},
	keywords: [
		'watchlist',
		'movies',
		'tv shows',
		'tracker',
		'cinema',
		'films',
		'series',
	],
	authors: [{ name: 'SAWKIT' }],
	creator: 'SAWKIT',
	openGraph: {
		type: 'website',
		siteName: 'ReelMark',
		locale: 'en_US',
		images: [DEFAULT_OG_IMAGE],
	},
	twitter: {
		card: 'summary_large_image',
		images: [DEFAULT_OG_IMAGE.url],
	},
	appleWebApp: {
		capable: true,
		title: 'ReelMark',
		statusBarStyle: 'black-translucent',
		startupImage: [
			// iPhone SE 1st gen / iPod touch 5th gen — 320×568 @2x
			{
				url: '/splash/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png',
				media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/4__iPhone_SE__iPod_touch_5th_generation_and_later_landscape.png',
				media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPhone 6/6s/7/8/SE 2nd-3rd gen (4.7") — 375×667 @2x
			{
				url: '/splash/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png',
				media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_landscape.png',
				media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPhone 6s Plus/7 Plus/8 Plus — 414×736 @3x
			{
				url: '/splash/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png',
				media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape.png',
				media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone 11/XR — 414×896 @2x
			{
				url: '/splash/iPhone_11__iPhone_XR_portrait.png',
				media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_11__iPhone_XR_landscape.png',
				media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPhone X/XS/11 Pro/12 mini/13 mini — 375×812 @3x
			{
				url: '/splash/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png',
				media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png',
				media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone 12/12 Pro/13/13 Pro/14/16e/17e — 390×844 @3x
			{
				url: '/splash/iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png',
				media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_landscape.png',
				media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone 14 Pro/15/15 Pro/16/16 Pro — 393×852 @3x
			{
				url: '/splash/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png',
				media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape.png',
				media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone 16 Pro/17/17 Pro — 402×874 @3x
			{
				url: '/splash/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait.png',
				media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_landscape.png',
				media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone XS Max/11 Pro Max — 414×896 @3x
			{
				url: '/splash/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png',
				media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_11_Pro_Max__iPhone_XS_Max_landscape.png',
				media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone Air — 420×912 @3x
			{
				url: '/splash/iPhone_Air_portrait.png',
				media: '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_Air_landscape.png',
				media: '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone 12 Pro Max/13 Pro Max/14 Plus — 428×926 @3x
			{
				url: '/splash/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png',
				media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape.png',
				media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone 14 Pro Max/15 Plus/15 Pro Max/16 Plus — 430×932 @3x
			{
				url: '/splash/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png',
				media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape.png',
				media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPhone 16 Pro Max/17 Pro Max — 440×956 @3x
			{
				url: '/splash/iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png',
				media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
			},
			{
				url: '/splash/iPhone_17_Pro_Max__iPhone_16_Pro_Max_landscape.png',
				media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
			},
			// iPad mini 8.3" — 744×1133 @2x
			{
				url: '/splash/8.3__iPad_Mini_portrait.png',
				media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/8.3__iPad_Mini_landscape.png',
				media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad 9.7" / iPad mini / iPad Air — 768×1024 @2x
			{
				url: '/splash/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png',
				media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_landscape.png',
				media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad 10.2" — 810×1080 @2x
			{
				url: '/splash/10.2__iPad_portrait.png',
				media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/10.2__iPad_landscape.png',
				media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad Air 10.5" — 834×1112 @2x
			{
				url: '/splash/10.5__iPad_Air_portrait.png',
				media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/10.5__iPad_Air_landscape.png',
				media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad Air 10.9" — 820×1180 @2x
			{
				url: '/splash/10.9__iPad_Air_portrait.png',
				media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/10.9__iPad_Air_landscape.png',
				media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad Pro 11" / iPad Pro 10.5" — 834×1194 @2x
			{
				url: '/splash/11__iPad_Pro__10.5__iPad_Pro_portrait.png',
				media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/11__iPad_Pro__10.5__iPad_Pro_landscape.png',
				media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad Pro M4 11" — 834×1210 @2x
			{
				url: '/splash/11__iPad_Pro_M4_portrait.png',
				media: '(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/11__iPad_Pro_M4_landscape.png',
				media: '(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad Pro 12.9" — 1024×1366 @2x
			{
				url: '/splash/12.9__iPad_Pro_portrait.png',
				media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/12.9__iPad_Pro_landscape.png',
				media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
			// iPad Pro M4 13" — 1032×1376 @2x
			{
				url: '/splash/13__iPad_Pro_M4_portrait.png',
				media: '(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
			},
			{
				url: '/splash/13__iPad_Pro_M4_landscape.png',
				media: '(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
			},
		],
	},
	icons: {
		icon: [
			{
				url: '/maskable_icon_x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				url: '/maskable_icon_x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
		apple: [
			{
				url: '/maskable_icon_x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
		],
	},
};

export function generateStaticParams() {
	return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ lang: string }>;
}>) {
	const { lang: langParam } = await params;
	if (!isLanguage(langParam)) notFound();
	const lang: Language = langParam;
	const t = await getTranslations(lang);

	return (
		<html
			lang={lang}
			suppressHydrationWarning
			data-scroll-behavior="smooth"
		>
			<head>
				{/* Next n'émet plus que `mobile-web-app-capable` (vercel/next.js#70363) ; Safari iOS exige encore celle-ci pour afficher la launch image (vercel/next.js#74524, closed as not planned). */}
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<link rel="dns-prefetch" href="https://image.tmdb.org" />
				<style>{`#nprogress .bar { top: calc(4rem + env(safe-area-inset-top)) !important; }`}</style>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var h=document.documentElement,t=localStorage.getItem("theme"),m=window.matchMedia("(prefers-color-scheme: light)");function a(l){h.classList.remove("light","dark");h.classList.add(l?"light":"dark")}if(t==="light")a(true);else if(t==="dark")a(false);else{a(m.matches);m.addEventListener("change",function(e){var s=localStorage.getItem("theme");if(!s||s==="system")a(e.matches)})}}catch(e){}})()`,
					}}
				/>
			</head>
			<body
				className={`${sans.variable} ${display.variable} antialiased bg-background text-text`}
			>
				<PreventImageContextMenu />
				<Providers initialLang={lang}>
					<ScrollToTop />
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
					>
						{t.common.skipToMainContent}
					</a>
					<NextTopLoader
						color="var(--color-primary)"
						height={2}
						showSpinner={false}
						shadow={'sm'}
						easing="ease"
						speed={200}
						zIndex={9999}
					/>
					<Suspense fallback={<NavbarFallback />}>
						<Navbar />
					</Suspense>
					<PageTopGradient />
					<main id="main-content" className="page-top-offset">
						{children}
					</main>
					<footer className="border-t border-border-subtle mt-auto">
						<div className="container mx-auto px-6 lg:px-12 pt-8 page-bottom-clearance flex flex-col items-center gap-4 text-sm text-muted sm:flex-row sm:justify-between">
							<p>© {COPYRIGHT_YEAR} ReelMark</p>
							<nav
								aria-label={t.common.footerNav}
								className="flex flex-col items-center gap-4 sm:flex-row"
							>
								<SupportBadge
									lang={lang}
									label={t.support.nav}
								/>
								<span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
									<Link
										href={localizedHref(lang, '/terms')}
										className="hover:text-text whitespace-nowrap transition-colors"
									>
										{t.pages.legal.terms.title}
									</Link>
									<Link
										href={localizedHref(lang, '/privacy')}
										className="hover:text-text whitespace-nowrap transition-colors"
									>
										{t.pages.legal.privacy.title}
									</Link>
								</span>
							</nav>
						</div>
					</footer>
					<Suspense fallback={null}>
						<PromptSlot />
					</Suspense>
				</Providers>
				<Toaster />
			</body>
		</html>
	);
}
