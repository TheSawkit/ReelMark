/**
 * TMDB has no such resource. Routine rather than exceptional: recommendations and
 * similar-title endpoints answer 404 for niche entries, and ids disappear when a title
 * is merged or deleted upstream. Kept dependency-free so the client bundle can import it.
 */
export class TMDBNotFoundError extends Error {
	constructor(endpoint: string) {
		super(`TMDB API Error: 404 Not Found (${endpoint})`);
		this.name = 'TMDBNotFoundError';
	}
}

export function isTMDBNotFound(error: unknown): error is TMDBNotFoundError {
	return error instanceof TMDBNotFoundError;
}
