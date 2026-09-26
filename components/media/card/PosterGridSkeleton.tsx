import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton';
import { LIBRARY_GRID, MEDIA_GRID } from '@/components/media/card/grid';

const GRIDS = { media: MEDIA_GRID, library: LIBRARY_GRID } as const;

interface PosterGridSkeletonProps {
	count?: number;
	variant?: keyof typeof GRIDS;
}

/** Poster grid placeholder laid out by the same grid definition as the list it stands for. */
export function PosterGridSkeleton({
	count = 12,
	variant = 'media',
}: PosterGridSkeletonProps) {
	return (
		<div className={GRIDS[variant].className}>
			{Array.from({ length: count }).map((_, i) => (
				<MediaCardSkeleton key={i} />
			))}
		</div>
	);
}
