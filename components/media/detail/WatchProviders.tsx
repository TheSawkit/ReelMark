import Image from 'next/image';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getTranslations } from '@/lib/i18n/server';
import { getUserRegion } from '@/lib/tmdb/client';
import {
	getTmdbProviderLogoMap,
	resolveProviderLogo,
	normalizeName,
} from '@/lib/tmdb/watch-providers';
import { getAppStoreIconMap } from '@/lib/watchmode/app-store';
import { webLinkOrNull } from '@/lib/safe-link';
import { WatchNowPublisher } from '@/components/media/detail/WatchNowPublisher';
import type { WatchProvidersRegion, WatchProvider } from '@/types/tmdb';

interface WatchProvidersProps {
	providers: WatchProvidersRegion | null;
}

const REGION_CURRENCY: Record<string, string> = {
	US: 'USD',
	CA: 'CAD',
	GB: 'GBP',
	AU: 'AUD',
	JP: 'JPY',
	CH: 'CHF',
	FR: 'EUR',
	BE: 'EUR',
	DE: 'EUR',
	NL: 'EUR',
	IT: 'EUR',
	ES: 'EUR',
	PT: 'EUR',
	AT: 'EUR',
	IE: 'EUR',
	FI: 'EUR',
	SE: 'SEK',
	NO: 'NOK',
	DK: 'DKK',
};

function formatPrice(price: number, region: string): string {
	const currency = REGION_CURRENCY[region] ?? 'EUR';
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price);
}

function ProviderLogo({
	p,
	region,
	showPrice,
	logoMap,
	appStoreMap,
	fallbackUrl,
}: {
	p: WatchProvider;
	region: string;
	showPrice?: boolean;
	logoMap: Map<string, string>;
	appStoreMap: Map<string, string>;
	fallbackUrl?: string;
}) {
	const key = normalizeName(p.provider_name);
	const logoSrc =
		appStoreMap.get(key) ??
		resolveProviderLogo(
			p.provider_name,
			logoMap,
			p.logo_url,
			p.logo_path || undefined
		);

	const logo = logoSrc ? (
		<div
			className="relative w-10 h-10 rounded-xl overflow-hidden border border-border-subtle shrink-0"
			title={p.provider_name}
		>
			<Image
				src={logoSrc}
				alt={p.provider_name}
				fill
				className="object-contain"
				unoptimized
			/>
		</div>
	) : (
		<div
			className="w-10 h-10 rounded-xl flex items-center justify-center border border-border-subtle bg-surface-2 shrink-0"
			title={p.provider_name}
		>
			<span className="text-[9px] font-semibold text-muted text-center leading-tight px-1 line-clamp-2">
				{p.provider_name}
			</span>
		</div>
	);

	const inner = (
		<div className="flex flex-col items-center gap-1.5">
			{logo}
			{showPrice && p.price != null && (
				<span className="text-[10px] tabular-nums text-muted font-medium leading-none">
					{formatPrice(p.price, region)}
				</span>
			)}
		</div>
	);

	// Watchmode fournit l'URL profonde vers la plateforme, mais son quota est vite épuisé ;
	// on retombe alors sur les données TMDB, dépourvues d'URL par plateforme. Sans ce repli
	// vers la page JustWatch du titre, les logos cessaient d'être des liens du tout.
	const href = webLinkOrNull(p.web_url) ?? webLinkOrNull(fallbackUrl);

	if (href) {
		// Le logo ne fait que 40 px : le pseudo-élément porte la cible tactile à 48 px sans
		// décaler la grille. `active:` redonne au doigt le retour visuel que le
		// `-webkit-tap-highlight-color: transparent` global supprime.
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={p.provider_name}
				className="relative inline-flex transition-opacity hover:opacity-75 active:opacity-60 before:absolute before:-inset-1 before:content-['']"
				title={p.provider_name}
			>
				{inner}
			</a>
		);
	}

	return inner;
}

function ProviderGroup({
	label,
	providers,
	region,
	showPrice,
	logoMap,
	appStoreMap,
	fallbackUrl,
}: {
	label: string;
	providers: WatchProvider[];
	region: string;
	showPrice?: boolean;
	logoMap: Map<string, string>;
	appStoreMap: Map<string, string>;
	fallbackUrl?: string;
}) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-semibold uppercase tracking-wider text-muted">
				{label}
			</p>
			<div className="flex flex-wrap gap-3">
				{providers.map((p) => (
					<ProviderLogo
						key={p.provider_id}
						p={p}
						region={region}
						showPrice={showPrice}
						logoMap={logoMap}
						appStoreMap={appStoreMap}
						fallbackUrl={fallbackUrl}
					/>
				))}
			</div>
		</div>
	);
}

export async function WatchProviders({ providers }: WatchProvidersProps) {
	const [t, region] = await Promise.all([getTranslations(), getUserRegion()]);
	const [logoMap, appStoreMap] = await Promise.all([
		getTmdbProviderLogoMap(),
		getAppStoreIconMap(region),
	]);
	const td = t.movie;

	return (
		<section className="space-y-5">
			<WatchNowPublisher providers={providers} region={region} />
			<SectionHeading>{td.whereToWatch}</SectionHeading>

			{!providers ||
			(!providers.flatrate?.length &&
				!providers.rent?.length &&
				!providers.buy?.length) ? (
				<p className="text-muted text-sm">{td.noProviders}</p>
			) : (
				<div className="space-y-5">
					{providers.flatrate && providers.flatrate.length > 0 && (
						<ProviderGroup
							label={td.streaming}
							providers={providers.flatrate}
							region={region}
							logoMap={logoMap}
							appStoreMap={appStoreMap}
							fallbackUrl={providers.link}
						/>
					)}
					{providers.rent && providers.rent.length > 0 && (
						<ProviderGroup
							label={td.rent}
							providers={providers.rent}
							region={region}
							showPrice
							logoMap={logoMap}
							appStoreMap={appStoreMap}
							fallbackUrl={providers.link}
						/>
					)}
					{providers.buy && providers.buy.length > 0 && (
						<ProviderGroup
							label={td.buy}
							providers={providers.buy}
							region={region}
							showPrice
							logoMap={logoMap}
							appStoreMap={appStoreMap}
							fallbackUrl={providers.link}
						/>
					)}
				</div>
			)}
		</section>
	);
}
