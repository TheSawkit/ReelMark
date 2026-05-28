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
}: {
  p: WatchProvider;
  region: string;
  showPrice?: boolean;
  logoMap: Map<string, string>;
  appStoreMap: Map<string, string>;
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

  if (p.web_url) {
    return (
      <a
        href={p.web_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={p.provider_name}
        className="hover:opacity-75 transition-opacity"
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
}: {
  label: string;
  providers: WatchProvider[];
  region: string;
  showPrice?: boolean;
  logoMap: Map<string, string>;
  appStoreMap: Map<string, string>;
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
            />
          )}
        </div>
      )}
    </section>
  );
}
