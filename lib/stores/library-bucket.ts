'use client';

import { useSyncExternalStore } from 'react';
import { createKeyedStore } from '@/lib/stores/factory';
import { reportSwallowed } from '@/lib/report';
import type { MediaType, WatchStatus, WatchlistEntry } from '@/types/tmdb';

/** Un lot tel que le serveur le rend. */
export interface LibraryBucketPage {
	entries: WatchlistEntry[];
	tvProgress: Record<number, { watched: number; total: number }>;
	hasMore: boolean;
}

/** Un compartiment tel qu'il s'accumule côté client. */
export interface LibraryBucketData extends LibraryBucketPage {
	pagesLoaded: number;
}

type Fetcher = (
	mediaType: MediaType,
	status: WatchStatus,
	page: number
) => Promise<LibraryBucketPage>;

const store = createKeyedStore<LibraryBucketData>();
const inFlight = new Set<string>();

const key = (mediaType: MediaType, status: WatchStatus) =>
	`${mediaType}:${status}`;

function merge(
	current: LibraryBucketData | undefined,
	incoming: LibraryBucketPage
): LibraryBucketData {
	if (!current) return { ...incoming, pagesLoaded: 1 };
	return {
		entries: [...current.entries, ...incoming.entries],
		tvProgress: { ...current.tvProgress, ...incoming.tvProgress },
		hasMore: incoming.hasMore,
		pagesLoaded: current.pagesLoaded + 1,
	};
}

/**
 * Les compartiments de la bibliothèque déjà chargés, hors du cycle de rendu.
 * `/library` n'en affiche qu'un à la fois ; le serveur ne rend que le premier lot de
 * celui-là, les autres s'accumulent ici sans refaire un aller-retour à chaque bascule.
 */
export const libraryBucketStore = {
	/**
	 * Dépose le lot rendu par le serveur. Appelé pendant le rendu et sans notification :
	 * la valeur est lue dans la foulée, prévenir ici demanderait une mise à jour au milieu
	 * d'un rendu.
	 */
	seed(mediaType: MediaType, status: WatchStatus, page: LibraryBucketPage) {
		const id = key(mediaType, status);
		if (store.entries.has(id)) return;
		store.entries.set(id, { ...page, pagesLoaded: 1 });
	},

	get(mediaType: MediaType, status: WatchStatus): LibraryBucketData | null {
		return store.entries.get(key(mediaType, status)) ?? null;
	},

	/**
	 * Complète un compartiment lot par lot jusqu'à épuisement. Chaque lot est publié dès son
	 * arrivée : la grille s'étoffe pendant le chargement au lieu d'attendre la fin.
	 * Les appels concurrents sur la même clé se rejoignent.
	 */
	async ensure(
		mediaType: MediaType,
		status: WatchStatus,
		fetcher: Fetcher
	): Promise<void> {
		const id = key(mediaType, status);
		if (inFlight.has(id)) return;
		if (store.entries.get(id)?.hasMore === false) return;

		inFlight.add(id);
		try {
			for (;;) {
				const page = store.entries.get(id)?.pagesLoaded ?? 0;
				const incoming = await fetcher(mediaType, status, page);
				store.entries.set(id, merge(store.entries.get(id), incoming));
				store.notify();
				if (!incoming.hasMore || incoming.entries.length === 0) break;
			}
		} catch (error) {
			// Un lot manquant laisse le compartiment partiel plutôt que d'emporter la page ;
			// la prochaine visite reprendra où il s'est arrêté.
			reportSwallowed('library:bucket', error);
		} finally {
			inFlight.delete(id);
		}
	},

	reset() {
		store.entries.clear();
		inFlight.clear();
		store.notify();
	},
};

/** Version du store, pour redemander un rendu dès qu'un lot arrive. */
export function useLibraryBucketsVersion(): number {
	return useSyncExternalStore(store.subscribe, store.version, () => 0);
}
