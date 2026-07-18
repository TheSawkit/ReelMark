'use client';

import React from 'react';
import { siLetterboxd, siTrakt, siTvtime } from 'simple-icons';
import { useTranslation } from '@/lib/i18n/context';
import type { Platform } from '@/lib/parsers/import-watchlist';

type TranslationData = ReturnType<
	typeof useTranslation
>['t']['settings']['data'];
type CommonData = ReturnType<typeof useTranslation>['t']['common'];

function StepList({ steps }: { steps: readonly string[] }) {
	return (
		<ol className="space-y-1.5">
			{steps.map((step, i) => (
				<li
					key={i}
					className="flex items-start gap-2.5 text-xs text-muted"
				>
					<span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold text-text tabular-nums">
						{i + 1}
					</span>
					<span className="leading-relaxed">{step}</span>
				</li>
			))}
		</ol>
	);
}

function BrandIcon({ path, color }: { path: string; color: string }) {
	return (
		<svg
			role="img"
			viewBox="0 0 24 24"
			className="h-4 w-4 shrink-0"
			aria-hidden="true"
		>
			<path d={path} fill={`#${color}`} />
		</svg>
	);
}

export const PLATFORMS: Array<{
	id: Platform;
	label: string;
	logo: React.ReactNode;
}> = [
	{
		id: 'letterboxd',
		label: 'Letterboxd',
		logo: <BrandIcon path={siLetterboxd.path} color={siLetterboxd.hex} />,
	},
	{
		id: 'trakt',
		label: 'Trakt',
		logo: <BrandIcon path={siTrakt.path} color={siTrakt.hex} />,
	},
	{
		id: 'tvtime',
		label: 'TV Time',
		logo: <BrandIcon path={siTvtime.path} color={siTvtime.hex} />,
	},
];

/** Per-platform export walkthrough shown above the import dropzone. */
export function PlatformInstructions({
	platform,
	td,
	tc,
}: {
	platform: Platform;
	td: TranslationData;
	tc: CommonData;
}) {
	if (platform !== 'tvtime') {
		const steps =
			platform === 'letterboxd' ? td.steps.letterboxd : td.steps.trakt;
		return (
			<div className="rounded-xl border border-border/20 bg-surface-2/20 p-4 space-y-3">
				<p className="eyebrow">{td.howToGet}</p>
				<StepList steps={steps} />
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border/20 bg-surface-2/20 p-4 space-y-4">
			<p className="eyebrow">{td.howToGet}</p>

			<div className="space-y-2">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-xs font-semibold text-text">
						{td.method.extension}
					</span>
					<span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
						{td.method.recommended}
					</span>
					<span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] text-muted">
						{td.method.instant}
					</span>
				</div>
				<StepList steps={td.steps.tvtimeExtension} />
			</div>

			<div className="flex items-center gap-3">
				<div className="h-px flex-1 bg-border/20" />
				<span className="text-[10px] uppercase tracking-wider text-muted/60">
					{tc.or}
				</span>
				<div className="h-px flex-1 bg-border/20" />
			</div>

			<div className="space-y-2">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-xs font-semibold text-text">
						{td.method.official}
					</span>
					<span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] text-muted">
						{td.method.severalDays}
					</span>
				</div>
				<StepList steps={td.steps.tvtimeOfficial} />
			</div>
		</div>
	);
}
