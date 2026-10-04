import { Suspense } from 'react';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';
import Title from '@/components/layout/Title';
import { AI_ASSISTANT_SETTINGS_PATH } from '@/components/settings/tabs';
import { getTranslations } from '@/lib/i18n/server';
import { getUserContext } from '@/lib/supabase/auth-helpers';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';

/** Stamped at build time: a copyright year must not depend on when a page happens to render. */
const COPYRIGHT_YEAR = new Date().getFullYear();

const focusRing =
	'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const textLink = `whitespace-nowrap transition-colors hover:text-text ${focusRing}`;

/** Pill call-to-action — stands out from the plain text links around it. */
function PillLink({
	href,
	icon,
	children,
}: {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className="glass-surface inline-flex shrink-0 items-center gap-1.5 rounded-full border-primary/40 px-3 py-1.5 font-medium whitespace-nowrap text-text transition-colors duration-(--duration-fast) ease-apple hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
		>
			{icon}
			{children}
		</Link>
	);
}

/**
 * "Add to AI" opens the Settings card that makes the link, so it is only offered to signed-in
 * users. It reads the session, hence its own Suspense boundary: the rest of the footer stays in
 * the static shell. `getUserContext` is memoized, so this shares the navbar's auth check.
 */
async function AddToAiLink({ lang, label }: { lang: Language; label: string }) {
	const { user } = await getUserContext();
	if (!user) return null;
	return (
		<PillLink
			href={localizedHref(lang, AI_ASSISTANT_SETTINGS_PATH)}
			icon={<Sparkles className="size-3.5 text-primary" aria-hidden />}
		>
			{label}
		</PillLink>
	);
}

/** Site-wide footer: brand, the calls-to-action (plug an AI assistant in when signed in, support the app), then credits and legal links. */
export async function SiteFooter({ lang }: { lang: Language }) {
	const t = await getTranslations(lang);
	const tf = t.common.footer;
	const legalLinks = [
		['/terms', t.pages.legal.terms.title],
		['/privacy', t.pages.legal.privacy.title],
	] as const;

	return (
		<footer className="border-t border-border-subtle text-sm text-muted">
			<div className="container mx-auto px-6 lg:px-12 pt-10 page-bottom-clearance">
				<div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
					<div className="flex flex-col items-center gap-2 sm:items-start">
						<Link
							href={localizedHref(lang, '/')}
							className={`text-text ${focusRing}`}
						>
							<Title className="h-5 w-auto" />
						</Link>
						<p className="max-w-xs">{tf.tagline}</p>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<Suspense fallback={null}>
							<AddToAiLink lang={lang} label={tf.addToAi} />
						</Suspense>
						<PillLink
							href={localizedHref(lang, '/support')}
							icon={
								<Heart
									className="size-3.5 fill-primary text-primary"
									aria-hidden
								/>
							}
						>
							{t.support.nav}
						</PillLink>
					</div>
				</div>

				<div className="mt-8 flex flex-col items-center gap-3 border-t border-border-subtle pt-6 text-xs sm:flex-row sm:justify-between">
					<p className="text-center sm:text-left">
						© {COPYRIGHT_YEAR} ReelMark · {tf.dataFrom}{' '}
						<a
							href="https://www.themoviedb.org"
							target="_blank"
							rel="noopener noreferrer"
							className={textLink}
						>
							TMDB
						</a>
					</p>
					<nav
						aria-label={tf.nav}
						className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
					>
						{legalLinks.map(([path, label]) => (
							<Link
								key={path}
								href={localizedHref(lang, path)}
								className={textLink}
							>
								{label}
							</Link>
						))}
					</nav>
				</div>
			</div>
		</footer>
	);
}
