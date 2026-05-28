import type { ReactNode } from 'react';
import { MediaDescription } from '@/components/media/detail/MediaDescription';
import { WatchProviders } from '@/components/media/detail/WatchProviders';
import { CommunityRating } from '@/components/media/detail/CommunityRating';
import { MediaTrailers } from '@/components/media/detail/MediaTrailers';
import { MediaCast } from '@/components/media/detail/MediaCast';
import { MediaActionsBar } from '@/components/media/detail/MediaActionsBar';
import type { Video, Cast, WatchProvidersRegion } from '@/types/tmdb';

interface MediaDetailLayoutProps {
	banner: ReactNode;
	actionsBar?: ReactNode;
	description: string;
	watchProviders: WatchProvidersRegion | null;
	rating: { avg: number; count: number } | null;
	reviews: ReactNode;
	extraSections?: ReactNode;
	trailers: Video[];
	cast: Cast[];
}

/**
 * Generic slot-based layout for movie and TV show detail pages.
 * Enforces a fixed section order (description → providers → rating → reviews → extra → trailers → cast)
 * so both page types share identical structure without duplication.
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
				<WatchProviders providers={watchProviders} />
				{rating && (
					<CommunityRating avg={rating.avg} count={rating.count} />
				)}
				{reviews}
				{extraSections}
				{trailers.length > 0 && <MediaTrailers trailers={trailers} />}
				<MediaCast cast={cast.slice(0, 30)} />
			</div>
		</div>
	);
}
