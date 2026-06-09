'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { backfillListMetadata } from '@/app/actions/watchlist';

const SESSION_FLAG = 'reelmark:list-metadata-backfilled';

/**
 * Self-healing one-shot: on first library visit of a session, backfills release_date +
 * genre_ids for the user's pre-migration list rows, then refreshes so year sort and genre
 * filter work. No-op once every row is enriched. Renders nothing.
 */
export function ListMetadataBackfill() {
	const router = useRouter();
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		if (sessionStorage.getItem(SESSION_FLAG)) return;
		sessionStorage.setItem(SESSION_FLAG, '1');

		backfillListMetadata()
			.then((result) => {
				if (result.watchlist > 0 || result.playlistItems > 0) {
					router.refresh();
				}
			})
			.catch(() => {
				sessionStorage.removeItem(SESSION_FLAG);
			});
	}, [router]);

	return null;
}
