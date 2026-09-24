import { notFound } from 'next/navigation';
import { isTMDBNotFound } from '@/lib/tmdb/errors';

/** Maps a TMDB miss to the route's 404 and rethrows anything else, so an outage reaches the error boundary instead of posing as a missing page. */
export function notFoundIfMissing(error: unknown): never {
	if (isTMDBNotFound(error)) notFound();
	throw error;
}
