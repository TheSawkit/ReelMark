'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mediaWatchStore } from '@/lib/stores/media-watch';
import { episodeWatchStore } from '@/lib/stores/episode-watch';
import { VALID_MEDIA_TYPES, VALID_STATUSES } from '@/lib/validators';
import type { Database } from '@/types/database';
import type { MediaType, WatchStatus } from '@/types/tmdb';

type WatchlistRow = Database['public']['Tables']['watchlist']['Row'];
type EpisodeWatchRow = Database['public']['Tables']['episode_watches']['Row'];

interface RealtimeUserSyncProps {
	userId: string;
}

function isSyncableWatchlistRow(
	row: Partial<WatchlistRow> | undefined
): row is WatchlistRow {
	return (
		!!row &&
		typeof row.media_id === 'number' &&
		VALID_MEDIA_TYPES.has(row.media_type ?? '') &&
		VALID_STATUSES.has(row.status ?? '')
	);
}

function isSyncableEpisodeRow(
	row: Partial<EpisodeWatchRow> | undefined
): row is EpisodeWatchRow {
	return (
		!!row &&
		typeof row.tv_id === 'number' &&
		typeof row.season_number === 'number' &&
		typeof row.episode_number === 'number'
	);
}

/**
 * Keeps the client watch stores in sync with writes made from the user's other devices.
 *
 * Renders nothing. Payloads are applied to the stores only — never `router.refresh()`,
 * since the channel also echoes this device's own writes and refreshing there would
 * re-render the page on every click.
 */
export function RealtimeUserSync({ userId }: RealtimeUserSyncProps) {
	useEffect(() => {
		const supabase = createClient();

		const channel = supabase
			.channel(`user-sync:${userId}`)
			.on<WatchlistRow>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'watchlist',
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					const row =
						payload.eventType === 'DELETE'
							? payload.old
							: payload.new;
					if (!isSyncableWatchlistRow(row)) return;

					const mediaType = row.media_type as MediaType;
					if (payload.eventType === 'DELETE') {
						mediaWatchStore.applyRemote(
							mediaType,
							row.media_id,
							'none'
						);
						if (mediaType === 'tv')
							episodeWatchStore.clearShow(row.media_id);
						return;
					}

					mediaWatchStore.applyRemote(
						mediaType,
						row.media_id,
						row.status as WatchStatus
					);
				}
			)
			.on<EpisodeWatchRow>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'episode_watches',
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					const row =
						payload.eventType === 'DELETE'
							? payload.old
							: payload.new;
					if (!isSyncableEpisodeRow(row)) return;

					episodeWatchStore.applyRemoteEpisode(
						row.tv_id,
						row.season_number,
						row.episode_number,
						payload.eventType !== 'DELETE'
					);
				}
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [userId]);

	return null;
}
