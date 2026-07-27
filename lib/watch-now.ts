import { isSameProvider, providerNameKey } from '@/lib/provider-identity';
import type { WatchProvider } from '@/types/tmdb';

export interface WatchNowOption {
	providerId: number;
	providerName: string;
	logoPath: string;
	href: string;
}

export type WatchNowVariant = 'banner' | 'bar';

/**
 * The user's own streaming services that carry this title, with the deepest link available.
 * Subscription offers only: renting a title is not "watching it on your platform".
 *
 * @param flatrate - Subscription offers of the title in the user's region.
 * @param mine - Providers the user selected in settings, TMDB-sourced (name + logo).
 * @param fallbackHref - Title page used when the offer carries no per-provider deep link.
 */
export function matchMyProviders(
	flatrate: WatchProvider[] | undefined,
	mine: WatchProvider[],
	fallbackHref: string
): WatchNowOption[] {
	if (!flatrate?.length || mine.length === 0) return [];

	const options = new Map<string, WatchNowOption>();

	for (const offer of flatrate) {
		const owned = mine.find((p) =>
			isSameProvider(offer.provider_name, p.provider_name)
		);
		if (!owned) continue;

		const href = offer.web_url || fallbackHref;
		if (!href) continue;

		const key = providerNameKey(owned.provider_name);
		if (options.has(key)) continue;

		options.set(key, {
			providerId: owned.provider_id,
			providerName: owned.provider_name,
			logoPath: owned.logo_path,
			href,
		});
	}

	return [...options.values()];
}

const WATCH_NOW_BASE =
	'flex items-center justify-center gap-2 shrink-0 font-semibold text-sm text-white bg-primary hover:bg-primary-hover border border-transparent shadow-card-sm transition-all duration-(--duration-fast) ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const WATCH_NOW_SHAPE: Record<WatchNowVariant, string> = {
	banner: 'w-full sm:w-auto min-h-11 px-4 py-2.5 rounded-lg',
	bar: 'h-12 w-12 lg:h-auto lg:w-auto lg:min-h-11 lg:px-4 lg:py-2.5 rounded-full lg:rounded-lg',
};

/** Shared skin of the play control, so the plain link and the menu trigger stay identical. */
export function watchNowClass(variant: WatchNowVariant): string {
	return `${WATCH_NOW_BASE} ${WATCH_NOW_SHAPE[variant]}`;
}
