import type { MediaBannerProps } from '@/types/components';
import { InfoBadge, RatingBadge } from '@/components/ui/InfoBadge';
import { DetailHero } from '@/components/media/detail/DetailHero';
import { BackButton } from '@/components/media/detail/BackButton';
import { formatRuntime } from '@/lib/format';

/** Movie / show hero: DetailHero fed with the title's rating, year, runtime and certification. */
export function MediaBanner({
	title,
	tagline,
	backdropUrl,
	posterPath,
	voteAverage,
	releaseDate,
	runtime,
	certification,
	genres,
	actions,
	communityBadge,
}: MediaBannerProps) {
	return (
		<DetailHero
			title={title}
			backdropUrl={backdropUrl}
			posterPath={posterPath}
			tagline={tagline}
			genres={genres}
			actions={actions}
			backControl={<BackButton />}
			meta={
				<>
					{voteAverage && voteAverage > 0 ? (
						<RatingBadge value={voteAverage.toFixed(1)} />
					) : null}
					{communityBadge}
					{releaseDate && (
						<InfoBadge>{releaseDate.slice(0, 4)}</InfoBadge>
					)}
					{runtime && runtime > 0 ? (
						<InfoBadge>{formatRuntime(runtime)}</InfoBadge>
					) : null}
					{certification}
				</>
			}
		/>
	);
}
