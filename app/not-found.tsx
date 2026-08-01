'use client';

import './globals.css';
import { useState } from 'react';
import { Inter, Bebas_Neue } from 'next/font/google';
import { translations } from '@/lib/i18n/translations';
import { detectClientLanguage } from '@/lib/i18n/client-language';

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

/**
 * 404 for paths outside any locale segment.
 *
 * `app/[lang]/layout.tsx` is the root layout, so its `notFound()` had no parent boundary to land
 * in and escalated to `global-error` — a 500 for every unmatched path a crawler tries
 * (`/config.json`, a missing static file). This page gives it a destination, and carries its own
 * `<html>` for the same reason `global-error` does.
 */
export default function NotFound() {
	const [lang] = useState(detectClientLanguage);
	const t = translations[lang].common;

	return (
		<html lang={lang} suppressHydrationWarning>
			<body
				className={`${sans.variable} ${display.variable} min-h-screen flex items-center justify-center bg-background text-text font-sans p-6 antialiased`}
			>
				<main className="max-w-md w-full text-center space-y-6">
					<p className="text-6xl font-bold text-primary">404</p>
					<div className="space-y-2">
						<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
							{t.notFoundTitle}
						</h1>
						<p className="text-muted leading-relaxed">
							{t.notFoundDescription}
						</p>
					</div>
					{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
					<a
						href="/"
						className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all active:scale-95 cursor-pointer shadow-card-sm"
					>
						{t.errorBackHome}
					</a>
				</main>
			</body>
		</html>
	);
}
