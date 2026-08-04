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
import { APPLE_SPLASH_SCREENS } from '@/lib/pwa-splash-screens';
import { BASE_URL, DEFAULT_OG_IMAGE } from '@/lib/metadata';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { PreventImageContextMenu } from '@/components/shared/PreventImageContextMenu';
import { PreventPinchZoom } from '@/components/shared/PreventPinchZoom';
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

// Zoom verrouillé côté produit : pincement et double tap partaient tout seuls pendant le
// défilement en PWA. Le verrou vit dans `touch-action` (globals.css) et dans PreventPinchZoom
// pour iOS — pas dans `userScalable`, qu'iOS ignore depuis la version 10. Compromis assumé :
// le critère WCAG 1.4.4 n'est plus rempli, les malvoyants perdent l'agrandissement natif.
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
		startupImage: APPLE_SPLASH_SCREENS,
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
			{/* Les extensions posent leurs attributs sur le body avant que React n'hydrate
			    (`cz-shortcut-listen` de ColorZilla, `data-gr-*` de Grammarly…) et chacune
			    lève un mismatch d'hydratation. `suppressHydrationWarning` ne se propage pas
			    depuis <html> : il ne couvre que l'élément qui le porte. */}
			<body
				suppressHydrationWarning
				className={`${sans.variable} ${display.variable} antialiased bg-background text-text`}
			>
				<PreventImageContextMenu />
				<PreventPinchZoom />
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
					{/* Sans hauteur plancher, le pied de page est visible tant que le contenu n'est pas
					    arrivé, puis chassé hors de l'écran quand il arrive : 0.0989 de CLS à lui seul
					    sur /library en 1440x900. Le padding est compris dans la mesure (border-box),
					    donc le pied de page démarre exactement sous la ligne de flottaison. */}
					<main
						id="main-content"
						className="page-top-offset min-h-svh"
					>
						{children}
					</main>
					<footer className="border-t border-border-subtle">
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
