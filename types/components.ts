import type { ReactNode } from 'react';
import type {
	MediaItem,
	MediaType,
	Cast,
	Video,
	CrewDetails,
	WatchStatus,
} from '@/types/tmdb';
import type { FilmographyDepartment } from '@/lib/filmography';

export interface FeatureCardProps {
	icon: ReactNode;
	title: string;
	description: string;
}

export interface MediaGridProps {
	items: MediaItem[];
	hideRating?: boolean;
	showWatchlistMeta?: boolean;
}

export interface MediaCardProps {
	media: MediaItem;
	className?: string;
	hideRating?: boolean;
}

export interface MediaSectionProps {
	title: string;
	items: MediaItem[];
	categoryUrl: string;
	hideRating?: boolean;
}

export interface InfiniteScrollMediaProps {
	initialItems: MediaItem[];
	category: string;
	mediaType?: MediaType;
	clientSideData?: MediaItem[];
	hideRating?: boolean;
	showWatchlistMeta?: boolean;
}

export interface MediaBannerProps {
	title: string;
	tagline?: string;
	backdropUrl: string;
	posterPath: string | null;
	voteAverage?: number;
	releaseDate?: string;
	runtime?: number;
	certification?: string;
	genres?: { id: number; name: string }[];
	actions?: ReactNode;
	communityBadge?: ReactNode;
}

export interface MediaDescriptionProps {
	description: string;
}

export interface MediaTrailersProps {
	trailers: Video[];
}

export interface MediaCastProps {
	cast: Cast[];
}

export interface WatchButtonProps {
	mediaId: number;
	mediaTitle: string;
	mediaType: MediaType;
	posterPath: string | null;
	status: WatchStatus;
	initialIsActive?: boolean;
	fallbackStatus?: WatchStatus;
	variant?: 'icon' | 'full' | 'responsive';
	onDark?: boolean;
	releaseDate?: string;
}

export interface NavbarUser {
	id: string;
	email?: string;
	user_metadata: {
		full_name?: string;
		username?: string;
		picture?: string;
		avatar_url?: string;
		email?: string;
	};
}

export interface NavLinksProps {
	username?: string;
	className?: string;
}

export interface HorizontalScrollProps {
	children: ReactNode;
	title?: ReactNode;
	scrollAmount?: number;
	className?: string;
	containerClassName?: string;
}

export interface CrewBannerProps {
	crew: CrewDetails;
}

export interface CrewBioProps {
	biography: string;
}

export interface CrewFilmographyProps {
	departments: FilmographyDepartment[];
}
