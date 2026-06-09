import Link from 'next/link';
import { Play } from 'lucide-react';
import Title from '@/components/layout/Title';
import { getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';
import { Aurora } from '@/components/effects/Aurora';
import { Spotlight } from '@/components/effects/Spotlight';
import { Grain } from '@/components/effects/Grain';
import { GlowBorder } from '@/components/effects/GlowBorder';
import { PosterWall } from '@/components/home/PosterWall';
import type { MediaItem } from '@/types/tmdb';

const SLIDE = 'slideUpSubtle var(--duration-slowest) ease-out both';

export default async function HeroSection({
	posters,
	lang,
}: {
	posters: MediaItem[];
	lang: Language;
}) {
	const t = await getTranslations(lang);

	return (
		<section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 py-24 lg:px-12">
			<PosterWall items={posters} />
			<div className="absolute inset-0 bg-background/55" />
			<Aurora intensity={0.7} />
			<Spotlight />
			<Grain />
			<div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/30" />

			<div className="relative z-10 mx-auto max-w-4xl text-center">
				<h1
					className="mb-6 font-display text-6xl font-normal tracking-tight text-text sm:text-7xl md:text-8xl lg:text-9xl"
					style={{ animation: SLIDE }}
				>
					<Title className="inline-block h-[1em] w-auto text-text drop-shadow-text" />
				</h1>

				<p
					className="mx-auto mb-3 max-w-2xl text-xl text-muted md:text-2xl"
					style={{
						animation: SLIDE,
						animationDelay: 'var(--duration-fast)',
					}}
				>
					{t.hero.subtitle}
				</p>
				<p
					className="mx-auto mb-12 max-w-2xl text-2xl font-semibold text-text md:text-4xl"
					style={{
						animation: SLIDE,
						animationDelay: 'var(--duration-medium)',
					}}
				>
					{t.hero.description}
				</p>

				<div
					className="flex flex-col items-center justify-center gap-4 sm:flex-row"
					style={{
						animation: SLIDE,
						animationDelay: 'var(--duration-slower)',
					}}
				>
					<Link
						href={localizedHref(lang, '/signup')}
						className="group/cta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
					>
						<GlowBorder radius={16} pad={1.5}>
							<span className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-lg font-bold text-black transition-transform duration-(--duration-fast) ease-apple group-hover/cta:scale-[1.02]">
								<Play className="h-5 w-5 fill-current" />
								{t.hero.cta}
							</span>
						</GlowBorder>
					</Link>

					<Link
						href={localizedHref(lang, '/login')}
						className="glass-surface inline-flex h-14 items-center justify-center rounded-2xl px-8 text-lg font-semibold text-text transition-colors duration-(--duration-fast) ease-apple hover:bg-glass-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						{t.hero.login}
					</Link>
				</div>
			</div>
		</section>
	);
}
