'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import type { LucideIcon } from 'lucide-react';

interface ErrorCardProps {
	reset: () => void;
	icon?: LucideIcon;
	backHref?: '/explorer' | '/dashboard' | null;
}

/** Centered glass error card with retry + optional back link. */
export function ErrorCard({
	reset,
	icon: Icon = AlertTriangle,
	backHref = '/explorer',
}: ErrorCardProps) {
	const { t } = useTranslation();
	const backLabel =
		backHref === '/dashboard'
			? t.common.errorBackHome
			: t.common.backToExplorer;

	return (
		<div className="min-h-[70vh] flex items-center justify-center p-6">
			<div className="max-w-md w-full text-center space-y-6 bg-glass-bg p-8 rounded-(--radius-xl) border border-glass-border shadow-cinema backdrop-blur-sm animate-in fade-in scale-in duration-(--duration-slow)">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-bright/15 text-gold mb-2">
					<Icon className="w-10 h-10" />
				</div>

				<div>
					<h1 className="text-2xl font-bold tracking-tight text-text mb-2">
						{t.common.errorTitle}
					</h1>
					<p className="text-muted">{t.common.errorDescription}</p>
				</div>

				<div className="flex flex-col gap-3 pt-4">
					<Button onClick={() => reset()} className="w-full">
						{t.common.errorRetry}
					</Button>
					{backHref !== null && (
						<Button variant="outline" asChild className="w-full">
							<Link href={backHref}>{backLabel}</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
