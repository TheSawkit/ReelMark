import Link from 'next/link';
import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { getMediaHref } from '@/lib/media';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { TiltCard } from '@/components/effects/TiltCard';
import { Aurora } from '@/components/effects/Aurora';
import { Spotlight } from '@/components/effects/Spotlight';
import { Grain } from '@/components/effects/Grain';
import { PauseWhenOffscreen } from '@/components/effects/PauseWhenOffscreen';
import { GlowBorder } from '@/components/effects/GlowBorder';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { BlurredPosterBackdrop } from '@/components/shared/BlurredPosterBackdrop';

export interface FeaturedHero {
	id: number;
	media_type: 'movie' | 'tv';
	title: string;
	backdropPath: string | null;
	posterPath: string | null;
	voteAverage: number;
	genres: { id: number; name: string }[];
	progress: { watched: number; total: number } | null;
	resume: boolean;
}

interface DashboardHeroProps {
	item: FeaturedHero;
	resumeLabel: string;
	discoverLabel: string;
}

/** Cinematic "resume / discover" hero featuring the user's next title to watch. */
export async function DashboardHero({
	item,
	resumeLabel,
	discoverLabel,
}: DashboardHeroProps) {
	const cta = item.resume ? resumeLabel : discoverLabel;
	const lang = await getServerLanguage();

	return (
		<div className="mb-10">
			<TiltCard max={5} radius={24} glow={false}>
				<Link
					href={localizedHref(lang, getMediaHref(item))}
					className="relative block h-104 sm:h-112 overflow-hidden rounded-3xl border border-border shadow-card-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
				>
					{item.backdropPath ? (
						<Image
							src={getImageUrl(item.backdropPath, 'w1280')}
							alt={item.title}
							fill
							priority
							className="object-cover object-top"
							sizes="(max-width: 1024px) 100vw, 900px"
						/>
					) : (
						<BlurredPosterBackdrop
							posterPath={item.posterPath}
							variant="banner"
						/>
					)}

					<PauseWhenOffscreen className="absolute inset-0">
						<Aurora intensity={0.65} />
						<Spotlight />
					</PauseWhenOffscreen>
					<Grain />
					<div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-transparent" />

					<div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
						<Play className="h-3.5 w-3.5 fill-primary text-primary" />
						<span className="text-xs font-bold uppercase tracking-wide text-white">
							{cta}
						</span>
					</div>

					<div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
						{item.genres.length > 0 && (
							<div className="mb-3 flex flex-wrap gap-2">
								{item.genres.slice(0, 3).map((g) => (
									<span
										key={g.id}
										className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-md"
									>
										{g.name}
									</span>
								))}
							</div>
						)}

						<h2 className="heading-display leading-none text-4xl text-white drop-shadow-text sm:text-5xl">
							{item.title}
						</h2>

						{item.voteAverage > 0 && (
							<div className="mt-3 flex items-center gap-3 text-sm">
								<span className="inline-flex items-center gap-1 font-semibold text-gold-bright">
									<Star className="h-4 w-4 fill-current" />
									{item.voteAverage.toFixed(1)}
								</span>
							</div>
						)}

						{item.progress && item.progress.total > 0 && (
							<div className="mt-4 max-w-md">
								<ProgressBar
									watched={item.progress.watched}
									total={item.progress.total}
								/>
							</div>
						)}

						<div className="mt-5 inline-flex">
							<GlowBorder radius={14} pad={1.5}>
								<span className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-bold text-black">
									<Play className="h-5 w-5 fill-current" />
									{cta}
								</span>
							</GlowBorder>
						</div>
					</div>
				</Link>
			</TiltCard>
		</div>
	);
}
