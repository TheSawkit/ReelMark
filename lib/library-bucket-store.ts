'use client';

import { useSyncExternalStore } from 'react';
import { createKeyedStore } from '@/lib/keyed-store';
import { reportSwallowed } from '@/lib/report';
import type { MediaType, WatchStatus, WatchlistEntry } from '@/types/tmdb';

export interface LibraryBucketData {
	entries: WatchlistEntry[];
	tvProgress: Record<number, { watched: number; total: number }>;
}

type Fetcher = (
	mediaType: MediaType,
	status: WatchStatus
) => Promise<LibraryBucketData>;

const store = createKeyedStore<LibraryBucketData>();
const inFlight = new Set<string>();

const key = (mediaType: MediaType, status: WatchStatus) =>
	`${mediaType}:${status}`;

/**
 * Les compartiments de la bibliothèque déjà chargés, hors du cycle de rendu.
 * `/library` n'en affiche qu'un à la fois ; le serveur ne rend que celui-là et les autres
 * arrivent ici au fil des demandes, sans refaire un aller-retour à chaque bascule.
 */
export const libraryBucketStore = {
	/**
	 * Dépose le compartiment rendu par le serveur. Appelé pendant le rendu et sans
	 * notification : la valeur est lue dans la foulée, prévenir ici demanderait une mise à
	 * jour au milieu d'un rendu.
	 */
	seed(mediaType: MediaType, status: WatchStatus, bucket: LibraryBucketData) {
		const id = key(mediaType, status);
		if (store.entries.has(id)) return;
		store.entries.set(id, bucket);
	},

	get(mediaType: MediaType, status: WatchStatus): LibraryBucketData | null {
		return store.entries.get(key(mediaType, status)) ?? null;
	},

	/** Charge un compartiment absent. Les appels concurrents pour la même clé se rejoignent. */
	async ensure(
		mediaType: MediaType,
		status: WatchStatus,
		fetcher: Fetcher
	): Promise<void> {
		const id = key(mediaType, status);
		if (store.entries.has(id) || inFlight.has(id)) return;
		inFlight.add(id);
		try {
			const bucket = await fetcher(mediaType, status);
			store.entries.set(id, bucket);
			store.notify();
		} catch (error) {
			// Un compartiment manquant laisse son onglet en attente plutôt que d'emporter la
			// page ; la prochaine demande retentera.
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

/** Version du store, pour redemander un rendu dès qu'un compartiment arrive. */
export function useLibraryBucketsVersion(): number {
	return useSyncExternalStore(store.subscribe, store.version, () => 0);
}
