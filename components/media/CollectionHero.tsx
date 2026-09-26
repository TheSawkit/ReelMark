import { InfoBadge } from '@/components/ui/InfoBadge';
import { DetailHero } from '@/components/media/detail/DetailHero';
import { BackButton } from '@/components/media/detail/BackButton';
import { getImageUrl } from '@/lib/tmdb/images';
import type { CollectionDetails } from '@/types/tmdb';

interface CollectionHeroProps {
	collection: CollectionDetails;
	countLabel: string;
}

/** Saga hero: the collection's own art and overview, with how many films it gathers. */
export function CollectionHero({
	collection,
	countLabel,
}: CollectionHeroProps) {
	return (
		<DetailHero
			title={collection.name}
			backdropUrl={getImageUrl(
				collection.backdrop_path ?? collection.poster_path,
				'w1280'
			)}
			posterPath={collection.poster_path}
			tagline={collection.overview}
			backControl={<BackButton />}
			meta={
				<InfoBadge>
					{collection.parts.length} {countLabel}
				</InfoBadge>
			}
		/>
	);
}
