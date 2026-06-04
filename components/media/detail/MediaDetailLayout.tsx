import type { ReactNode } from 'react';
import { MediaDescription } from '@/components/media/detail/MediaDescription';
import { CommunityRating } from '@/components/media/detail/CommunityRating';
import { MediaCast } from '@/components/media/detail/MediaCast';
import { MediaActionsBar } from '@/components/media/detail/MediaActionsBar';
import type { Cast } from '@/types/tmdb';

interface MediaDetailLayoutProps {
	banner: ReactNode;
	actionsBar?: ReactNode;
	description: string;
	watchProviders: ReactNode;
	rating: { avg: number; count: number } | null;
	reviews: ReactNode;
	extraSections?: ReactNode;
	trailers: ReactNode;
	cast: Cast[];
}

/**
 * Generic slot-based layout for movie and TV show detail pages.
 * Enforces a fixed section order (description → providers → rating → reviews → extra → trailers → cast)
 * so both page types share identical structure without duplication.
 * Slow slots (watchProviders, trailers, reviews) are passed as nodes so pages can stream them via Suspense.
 */
export function MediaDetailLayout({
	banner,
	actionsBar,
	description,
	watchProviders,
	rating,
	reviews,
	extraSections,
	trailers,
	cast,
}: MediaDetailLayoutProps) {
	return (
		<div className="min-h-screen">
			{banner}
			{actionsBar && <MediaActionsBar>{actionsBar}</MediaActionsBar>}
			<div className="container mx-auto px-6 lg:px-12 py-12 md:py-16 space-y-14 md:space-y-16">
				<MediaDescription description={description} />
				{watchProviders}
				{rating && (
					<CommunityRating avg={rating.avg} count={rating.count} />
				)}
				{reviews}
				{extraSections}
				{trailers}
				<MediaCast cast={cast.slice(0, 30)} />
			</div>
		</div>
	);
}
