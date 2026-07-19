import type { WatchStatus } from '@/types/tmdb';

export interface ExportData {
	version: 1;
	exported_at: string;
	watchlist: Array<{
		media_id: number;
		media_type: string;
		media_title: string;
		poster_path: string | null;
		status: string;
		created_at: string;
	}>;
	reviews: Array<{
		media_id: number;
		media_type: string;
		media_title: string;
		poster_path: string | null;
		rating: number | null;
		content: string | null;
		created_at: string;
	}>;
	episode_watches: Array<{
		tv_id: number;
		season_number: number;
		episode_number: number;
		watched_at: string | null;
	}>;
}

export interface ImportItem {
	title: string;
	year: number | null;
	status: WatchStatus;
	rating?: number | null;
	tmdbId?: number | null;
	imdbId?: string | null;
	tvdbId?: number | null;
	mediaType?: 'movie' | 'tv' | null;
	posterPath?: string | null;
	watchedEpisodes?: Array<{ season: number; episode: number }> | null;
}

export interface ImportedList {
	name: string;
	description: string | null;
	items: ImportItem[];
}

export interface ImportBatchResult {
	imported: number;
	failed: string[];
}

export interface ImportMatch {
	id: number;
	type: 'movie' | 'tv';
	title: string;
	poster_path: string | null;
}
