'use client';

import dynamic from 'next/dynamic';
import { Play } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { useWatchNowOptions } from '@/lib/watch-now-store';
import { watchNowClass, type WatchNowVariant } from '@/lib/watch-now';

const WatchNowMenu = dynamic(() =>
	import('@/components/media/detail/WatchNowMenu').then((m) => m.WatchNowMenu)
);

/**
 * Play control for the title being viewed: a direct link when a single one of the user's
 * services carries it, a platform picker otherwise. Renders nothing until `WatchNowPublisher`
 * has resolved the offers, and stays empty when none of them match.
 */
export function WatchNowSlot({ variant }: { variant: WatchNowVariant }) {
	const { t } = useTranslation();
	const options = useWatchNowOptions();

	if (options.length === 0) return null;
	if (options.length > 1) {
		return <WatchNowMenu options={options} variant={variant} />;
	}

	const [only] = options;
	const label = t.movie.watchOn.replace('${provider}', only.providerName);

	return (
		<a
			href={only.href}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={label}
			className={watchNowClass(variant)}
		>
			<Play className="h-4 w-4 fill-current" aria-hidden />
			<span
				className={variant === 'bar' ? 'hidden lg:inline' : undefined}
			>
				{label}
			</span>
		</a>
	);
}
