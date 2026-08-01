'use client';

import './globals.css';
import * as Sentry from '@sentry/nextjs';
import { translations } from '@/lib/i18n/translations';
import { detectClientLanguage } from '@/lib/i18n/client-language';
import { useEffect, useState } from 'react';
import { Inter, Bebas_Neue } from 'next/font/google';

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

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	const [lang] = useState(detectClientLanguage);

	const t = translations[lang].common;

	return (
		<html lang={lang} suppressHydrationWarning>
			<body
				className={`${sans.variable} ${display.variable} min-h-screen flex items-center justify-center bg-background text-text font-sans p-6 antialiased`}
			>
				<main className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
					<div className="space-y-2">
						<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
							{t.errorTitle}
						</h1>
						<p className="text-muted leading-relaxed">
							{t.errorDescription}
						</p>
					</div>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<button
							onClick={() => reset()}
							className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all active:scale-95 cursor-pointer shadow-card-sm"
						>
							{t.errorRetry}
						</button>
						{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
						<a
							href="/"
							className="w-full sm:w-auto px-6 py-2.5 bg-surface-2 hover:bg-surface-3 text-text rounded-lg font-medium transition-all cursor-pointer border border-border/10"
						>
							{t.errorBackHome}
						</a>
					</div>
				</main>
			</body>
		</html>
	);
}
