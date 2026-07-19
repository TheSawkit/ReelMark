import type { ReactNode } from 'react';
import { MediaDescription } from '@/components/media/detail/MediaDescription';
import { MediaCast } from '@/components/media/detail/MediaCast';
import { MediaCrew } from '@/components/media/detail/MediaCrew';
import { MediaActionsBar } from '@/components/media/detail/MediaActionsBar';
import type { Cast, CreatedBy, GroupedCrew } from '@/types/tmdb';

interface MediaDetailLayoutProps {
	banner: ReactNode;
	actionsBar?: ReactNode;
	description: string;
	crew?: GroupedCrew;
	creators?: CreatedBy[];
	watchProviders: ReactNode;
	rating: ReactNode;
	reviews: ReactNode;
	extraSections?: ReactNode;
	relatedSections?: ReactNode;
	trailers: ReactNode;
	cast: Cast[];
}

/**
 * Generic slot-based layout for movie and TV show detail pages.
 * Enforces a fixed section order (description → providers → rating → reviews → extra → trailers → cast → crew → related)
 * so both page types share identical structure without duplication.
 * Slow slots (watchProviders, trailers, reviews, relatedSections) are passed as nodes so pages can stream them via Suspense.
 */
export function MediaDetailLayout({
	banner,
	actionsBar,
	description,
	crew,
	creators,
	watchProviders,
	rating,
	reviews,
	extraSections,
	relatedSections,
	trailers,
	cast,
}: MediaDetailLayoutProps) {
	return (
		<div className="min-h-screen">
			{banner}
			{actionsBar && <MediaActionsBar>{actionsBar}</MediaActionsBar>}
			<div className="detail-container">
				<MediaDescription description={description} />
				{watchProviders}
				{rating}
				{reviews}
				{extraSections}
				{trailers}
				<MediaCast cast={cast.slice(0, 30)} />
				{crew && <MediaCrew crew={crew} creators={creators} />}
				{relatedSections}
			</div>
		</div>
	);
}
