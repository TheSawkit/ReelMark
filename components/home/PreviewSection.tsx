import { MovingRow } from '@/components/effects/MovingRow';
import { MediaCard } from '@/components/media/card/MediaCard';
import { getMediaKey } from '@/lib/media';
import { getTranslations } from '@/lib/i18n/server';
import type { MediaItem } from '@/types/tmdb';

function PosterRow({
	items,
	reverse,
}: {
	items: MediaItem[];
	reverse?: boolean;
}) {
	if (items.length === 0) return null;
	return (
		<MovingRow speed={reverse ? 78 : 62} gap={14} reverse={reverse}>
			{items.map((m) => (
				<div key={getMediaKey(m)} className="w-28 sm:w-32 md:w-36">
					<MediaCard media={m} hideRating compact />
				</div>
			))}
		</MovingRow>
	);
}

export default async function PreviewSection({
	movies,
	shows,
}: {
	movies: MediaItem[];
	shows: MediaItem[];
}) {
	const t = await getTranslations();
	if (movies.length === 0 && shows.length === 0) return null;

	return (
		<section className="py-16 md:py-24">
			<div className="mx-auto mb-10 max-w-4xl px-6 text-center lg:px-12">
				<h2 className="mb-3 heading-display leading-none text-4xl text-text md:text-5xl">
					{t.home.preview.title}
				</h2>
				<p className="text-lg text-muted">{t.home.preview.subtitle}</p>
			</div>

			<div className="space-y-4">
				<PosterRow items={movies} />
				<PosterRow items={shows} reverse />
			</div>
		</section>
	);
}
