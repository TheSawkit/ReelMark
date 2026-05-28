import type { ImportItem } from '@/app/actions/data';
import type { WatchStatus } from '@/types/tmdb';

export type Platform = 'letterboxd' | 'trakt' | 'tvtime';

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (const ch of line) {
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current.trim());
	return result;
}

function parseLetterboxd(text: string): ImportItem[] {
	const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
	if (lines.length < 2) return [];
	const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
	const nameIdx = headers.indexOf('name');
	const yearIdx = headers.indexOf('year');
	const ratingIdx = headers.indexOf('rating');
	const watchedDateIdx = headers.indexOf('watched date');
	if (nameIdx === -1) return [];
	const isWatchlistCsv = watchedDateIdx === -1 && ratingIdx === -1;
	return lines.slice(1).flatMap((line) => {
		const cols = parseCSVLine(line);
		const title = cols[nameIdx]?.replace(/^"|"$/g, '') ?? '';
		if (!title) return [];
		const year =
			yearIdx !== -1 ? parseInt(cols[yearIdx] ?? '') || null : null;
		const rawRating =
			ratingIdx !== -1 ? parseFloat(cols[ratingIdx] ?? '') : NaN;
		const rating =
			!isNaN(rawRating) && rawRating > 0
				? Math.min(10, Math.round(rawRating * 2))
				: null;
		return [
			{
				title,
				year,
				status: (isWatchlistCsv
					? 'to_watch'
					: 'watched') as WatchStatus,
				rating,
				mediaType: 'movie' as const,
			},
		];
	});
}

function parseTvTimeRefract(arr: unknown[]): ImportItem[] {
	const items: ImportItem[] = [];
	for (const entry of arr) {
		if (typeof entry !== 'object' || entry === null) continue;
		const e = entry as Record<string, unknown>;
		const title = e.title ? String(e.title).trim() : null;
		if (!title) continue;
		const year = typeof e.year === 'number' ? e.year : null;

		const ids = e.id as Record<string, unknown> | undefined;

		if (Array.isArray(e.seasons)) {
			const tvStatus = typeof e.status === 'string' ? e.status : '';
			const status: WatchStatus =
				tvStatus === 'up_to_date' ? 'watched' : 'to_watch';
			const tvdbId = typeof ids?.tvdb === 'number' ? ids.tvdb : null;
			const yearInTitle = title.match(/^(.+?)\s*\((\d{4})\)\s*$/);
			const cleanTitle = yearInTitle ? yearInTitle[1].trim() : title;
			const seriesYear = yearInTitle ? parseInt(yearInTitle[2]) : year;
			items.push({
				title: cleanTitle,
				year: seriesYear,
				status,
				mediaType: 'tv',
				tvdbId,
			});
		} else if ('is_watched' in e) {
			const status: WatchStatus =
				e.is_watched === true ? 'watched' : 'to_watch';
			const imdbId =
				typeof ids?.imdb === 'string' && ids.imdb ? ids.imdb : null;
			items.push({ title, year, status, mediaType: 'movie', imdbId });
		}
	}
	return items;
}

function parseTvTimeGDPR(obj: Record<string, unknown>): ImportItem[] {
	const objects = (obj.data as Record<string, unknown> | undefined)?.objects;
	if (!Array.isArray(objects)) return [];
	const seen = new Set<string>();
	const items: ImportItem[] = [];
	for (const entry of objects) {
		const e = entry as Record<string, unknown>;
		const meta = e.meta as Record<string, unknown> | undefined;
		const title = meta?.name ? String(meta.name).trim() : null;
		if (!title) continue;
		const key = title.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		const dateStr = meta?.first_release_date
			? String(meta.first_release_date)
			: null;
		const year = dateStr ? parseInt(dateStr.slice(0, 4)) || null : null;
		items.push({
			title,
			year,
			status: 'watched' as WatchStatus,
			mediaType: 'tv' as const,
		});
	}
	return items;
}

function parseTvTimeJSON(obj: unknown): ImportItem[] {
	if (Array.isArray(obj)) return parseTvTimeRefract(obj);
	if (typeof obj === 'object' && obj !== null)
		return parseTvTimeGDPR(obj as Record<string, unknown>);
	return [];
}

function parseTvTimeCSV(text: string): ImportItem[] {
	const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
	if (lines.length < 2) return [];
	const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
	const seriesIdx = headers.findIndex(
		(h) =>
			h === 'name' ||
			h === 'show_name' ||
			h === 'series_name' ||
			h.includes('show') ||
			h.includes('series')
	);
	if (seriesIdx === -1) return [];
	const seen = new Set<string>();
	const items: ImportItem[] = [];
	for (const line of lines.slice(1)) {
		const cols = parseCSVLine(line);
		const title = cols[seriesIdx]?.replace(/^"|"$/g, '').trim() ?? '';
		if (!title) continue;
		const key = title.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		items.push({
			title,
			year: null,
			status: 'watched' as WatchStatus,
			mediaType: 'tv' as const,
		});
	}
	return items;
}

function parseTrakt(parsed: unknown): ImportItem[] {
	if (!Array.isArray(parsed)) return [];
	const items: ImportItem[] = [];
	for (const entry of parsed) {
		if (typeof entry !== 'object' || entry === null) continue;
		const e = entry as Record<string, unknown>;
		const isWatched = 'last_watched_at' in e || 'watched_at' in e;
		const status: WatchStatus = isWatched ? 'watched' : 'to_watch';

		const movie = e.movie as Record<string, unknown> | undefined;
		if (movie) {
			const ids = movie.ids as Record<string, unknown> | undefined;
			if (typeof ids?.tmdb === 'number') {
				items.push({
					title: String(movie.title ?? ''),
					year: typeof movie.year === 'number' ? movie.year : null,
					status,
					tmdbId: ids.tmdb,
					mediaType: 'movie',
				});
				continue;
			}
		}

		const show = e.show as Record<string, unknown> | undefined;
		if (show) {
			const ids = show.ids as Record<string, unknown> | undefined;
			if (typeof ids?.tmdb === 'number') {
				items.push({
					title: String(show.title ?? ''),
					year: typeof show.year === 'number' ? show.year : null,
					status,
					tmdbId: ids.tmdb,
					mediaType: 'tv',
				});
			}
		}
	}
	return items;
}

export async function parseImportFile(
	file: File,
	platform: Platform,
	unknownFormatMsg: string
): Promise<ImportItem[]> {
	const text = await file.text();
	if (platform === 'letterboxd') return parseLetterboxd(text);
	if (platform === 'tvtime') {
		try {
			return parseTvTimeJSON(JSON.parse(text));
		} catch {
			return parseTvTimeCSV(text);
		}
	}
	const obj = JSON.parse(text);
	if (platform === 'trakt') return parseTrakt(obj);
	throw new Error(unknownFormatMsg);
}
