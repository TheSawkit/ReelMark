'use client';

import dynamic from 'next/dynamic';
import { Play, Tv } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { useWatchNowOptions } from '@/lib/stores/watch-now';
import {
	WHERE_TO_WATCH_ID,
	watchNowClass,
	type WatchNowVariant,
} from '@/lib/watch-now';

const WatchNowMenu = dynamic(() =>
	import('@/components/media/detail/WatchNowMenu').then((m) => m.WatchNowMenu)
);

/**
 * Play control for the title being viewed: a direct link when a single one of the user's
 * services carries it, a platform picker otherwise. Until `WatchNowPublisher` resolves an offer
 * (or when none matches) the banner keeps the same footprint with a "where to watch" jump, so
 * the hero never grows a row late; the sticky bar just stays empty.
 */
export function WatchNowSlot({ variant }: { variant: WatchNowVariant }) {
	const { t } = useTranslation();
	const options = useWatchNowOptions();

	if (options.length === 0) {
		if (variant === 'bar') return null;
		return (
			<a
				href={`#${WHERE_TO_WATCH_ID}`}
				className={watchNowClass(variant, 'quiet')}
			>
				<Tv className="h-4 w-4" aria-hidden />
				{t.movie.whereToWatch}
			</a>
		);
	}
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
				className={
					variant === 'bar' ? 'inline max-lg:hidden' : undefined
				}
			>
				{label}
			</span>
		</a>
	);
}
