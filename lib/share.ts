const EPISODE_ANCHOR_PREFIX = 'episode-';

/** Where a shared link lands, without language prefix so each recipient opens it in their own. */
export const SHARE_PATH = {
	movie: (movieId: number) => `/movie/${movieId}`,
	show: (tvId: number) => `/tv/${tvId}`,
	season: (tvId: number, seasonNumber: number) =>
		`/tv/${tvId}/season/${seasonNumber}`,
	episode: (tvId: number, seasonNumber: number, episodeNumber: number) =>
		`/tv/${tvId}/season/${seasonNumber}#${episodeAnchorId(episodeNumber)}`,
	profile: (username: string) => `/profile/${username}`,
} as const;

/** DOM id of an episode card, the target of a shared episode link — episodes have no page of their own. */
export function episodeAnchorId(episodeNumber: number): string {
	return `${EPISODE_ANCHOR_PREFIX}${episodeNumber}`;
}

/** Episode number a URL hash points at, or null when the hash is not an episode anchor. */
export function episodeNumberFromHash(hash: string): number | null {
	const anchor = hash.replace(/^#/, '');
	if (!anchor.startsWith(EPISODE_ANCHOR_PREFIX)) return null;
	const digits = anchor.slice(EPISODE_ANCHOR_PREFIX.length);
	return /^\d+$/.test(digits) ? Number(digits) : null;
}

export interface SharedLink {
	title: string;
	url: string;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

type ShareDevice = Pick<Navigator, 'clipboard'> & {
	share?: (link: SharedLink) => Promise<void>;
};

function isCancellation(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError';
}

/** Opens the system share sheet where the browser has one, otherwise copies the link, so one button works on phones and desktops alike. */
export async function shareLink(
	link: SharedLink,
	device: ShareDevice = navigator
): Promise<ShareOutcome> {
	if (device.share) {
		try {
			await device.share(link);
			return 'shared';
		} catch (error) {
			if (isCancellation(error)) return 'cancelled';
		}
	}
	await device.clipboard.writeText(link.url);
	return 'copied';
}
