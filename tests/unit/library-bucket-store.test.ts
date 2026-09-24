import { describe, it, expect, vi, afterEach } from 'vitest';
import { libraryBucketStore } from '@/lib/stores/library-bucket';

const bucket = (title: string) => ({
	entries: [{ media_title: title } as never],
	tvProgress: {},
	hasMore: false,
});

describe('libraryBucketStore', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		libraryBucketStore.reset();
	});

	/** Le module est partagé par toutes les requêtes du serveur : la 1re bibliothèque rendue était servie à tous. */
	it('never keeps a bucket seeded during a server render', () => {
		libraryBucketStore.seed('movie', 'to_watch', bucket('Alice’s list'));
		expect(libraryBucketStore.get('movie', 'to_watch')).toBeNull();
	});

	it('keeps the first bucket seeded in the browser', () => {
		vi.stubGlobal('window', {});
		libraryBucketStore.seed('movie', 'to_watch', bucket('mine'));
		libraryBucketStore.seed('movie', 'to_watch', bucket('stale prop'));
		expect(libraryBucketStore.get('movie', 'to_watch')?.entries[0]).toEqual(
			{ media_title: 'mine' }
		);
	});
});
