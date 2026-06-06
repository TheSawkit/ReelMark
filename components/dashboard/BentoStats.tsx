import { Film, Tv, Bookmark, type LucideIcon } from 'lucide-react';
import { Aurora } from '@/components/effects/Aurora';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface BentoStatsProps {
	title: string;
	moviesWatched: number;
	episodesWatched: number;
	toWatch: number;
	labels: { movies: string; episodes: string; toWatch: string };
}

/** Compact stat grid summarizing the user's watch activity (data-backed counts). */
export function BentoStats({
	title,
	moviesWatched,
	episodesWatched,
	toWatch,
	labels,
}: BentoStatsProps) {
	const cells: { icon: LucideIcon; value: number; label: string }[] = [
		{ icon: Film, value: moviesWatched, label: labels.movies },
		{ icon: Tv, value: episodesWatched, label: labels.episodes },
		{ icon: Bookmark, value: toWatch, label: labels.toWatch },
	];

	return (
		<section className="mb-10 space-y-4">
			<SectionHeading>{title}</SectionHeading>
			<div className="grid grid-cols-3 gap-3 sm:gap-4">
				{cells.map(({ icon: Icon, value, label }, i) => (
					<div
						key={label}
						className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-5"
					>
						{i === 0 && <Aurora intensity={0.35} />}
						<div className="relative">
							<div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
								<Icon className="h-5 w-5" />
							</div>
							<div className="font-display text-3xl leading-none text-text sm:text-4xl">
								{value}
							</div>
							<div className="mt-1.5 text-xs text-muted sm:text-sm">
								{label}
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
