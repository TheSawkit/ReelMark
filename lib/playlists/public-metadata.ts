import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { reportSwallowed } from '@/lib/report';

export interface PublicPlaylistMeta {
	name: string;
	posterPath: string | null;
	ownerUsername: string | null;
}

/**
 * Name, cover and owner of a **public** playlist, for `generateMetadata` only.
 *
 * Cached and viewer-independent so the route can still prerender a static shell. Non-public
 * playlists resolve to null, which also keeps a private playlist's name out of the page title.
 */
export async function getPublicPlaylistMeta(
	id: string
): Promise<PublicPlaylistMeta | null> {
	'use cache';
	cacheTag(`playlist-meta:${id}`);
	cacheLife('hours');

	try {
		const supabase = createAdminClient();

		const { data } = await supabase
			.from('playlists')
			.select('name, user_id, items:playlist_items(poster_path)')
			.eq('id', id)
			.eq('visibility', 'public')
			.maybeSingle();

		if (!data) return null;

		const { data: owner } = await supabase
			.from('user_profiles')
			.select('username')
			.eq('user_id', data.user_id)
			.maybeSingle();

		return {
			name: data.name,
			posterPath: data.items?.[0]?.poster_path ?? null,
			ownerUsername: owner?.username ?? null,
		};
	} catch (error) {
		reportSwallowed('playlists:public-metadata', error);
		return null;
	}
}
