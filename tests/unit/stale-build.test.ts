import { describe, expect, it, vi, afterEach } from 'vitest';
import { isStaleBuildError, recoverFromStaleBuild } from '@/lib/stale-build';

describe('isStaleBuildError', () => {
	it('recognizes chunk load failures across browsers', () => {
		const chunkLoadError = new Error('Loading chunk 4237 failed.');
		chunkLoadError.name = 'ChunkLoadError';

		for (const error of [
			chunkLoadError,
			new Error('Failed to fetch dynamically imported module'),
			new Error('Loading CSS chunk app/layout failed.'),
			'Importing a module script failed',
		]) {
			expect(isStaleBuildError(error)).toBe(true);
		}
	});

	it('leaves unrelated errors alone', () => {
		for (const error of [
			new Error('Network request failed'),
			new TypeError('Cannot read properties of undefined'),
			null,
			undefined,
		]) {
			expect(isStaleBuildError(error)).toBe(false);
		}
	});
});

describe('recoverFromStaleBuild', () => {
	function stubBrowserGlobals() {
		const store = new Map<string, string>();
		const reload = vi.fn();
		vi.stubGlobal('window', {
			sessionStorage: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, value: string) => store.set(key, value),
			},
			location: { reload },
		});
		return reload;
	}

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('reloads the page', () => {
		const reload = stubBrowserGlobals();

		recoverFromStaleBuild();

		expect(reload).toHaveBeenCalledOnce();
	});

	it('does not reload again within the guard window', () => {
		const reload = stubBrowserGlobals();

		recoverFromStaleBuild();
		recoverFromStaleBuild();

		expect(reload).toHaveBeenCalledOnce();
	});

	/** A tab open long enough to span a second deployment must still recover. */
	it('reloads again once the guard window has elapsed', () => {
		vi.useFakeTimers();
		const reload = stubBrowserGlobals();

		recoverFromStaleBuild();
		vi.advanceTimersByTime(600_001);
		recoverFromStaleBuild();

		expect(reload).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it('stays silent outside the browser', () => {
		const reload = vi.fn();
		vi.stubGlobal('window', undefined);

		recoverFromStaleBuild();

		expect(reload).not.toHaveBeenCalled();
	});
});
