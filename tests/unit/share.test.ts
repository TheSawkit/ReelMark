import { describe, it, expect, vi } from 'vitest';
import {
	SHARE_PATH,
	episodeAnchorId,
	episodeNumberFromHash,
	shareLink,
} from '@/lib/share';

const LINK = { title: 'Fight Club', url: 'https://reelmark.app/movie/550' };

function clipboardDevice() {
	const writeText = vi.fn().mockResolvedValue(undefined);
	return {
		device: { clipboard: { writeText } as unknown as Clipboard },
		writeText,
	};
}

describe('SHARE_PATH', () => {
	it('points an episode at its card inside the season page', () => {
		expect(SHARE_PATH.episode(1399, 1, 5)).toBe(
			`/tv/1399/season/1#${episodeAnchorId(5)}`
		);
	});

	it('carries no language prefix', () => {
		expect(SHARE_PATH.movie(550)).toBe('/movie/550');
		expect(SHARE_PATH.show(1399)).toBe('/tv/1399');
		expect(SHARE_PATH.season(1399, 2)).toBe('/tv/1399/season/2');
		expect(SHARE_PATH.profile('neo')).toBe('/profile/neo');
	});
});

describe('episodeNumberFromHash', () => {
	it('reads back the episode a shared link points at', () => {
		expect(episodeNumberFromHash(`#${episodeAnchorId(12)}`)).toBe(12);
	});

	it.each([
		'',
		'#',
		'#where-to-watch',
		'#episode-',
		'#episode-2b',
		'#episode--1',
	])('ignores %j', (hash) => {
		expect(episodeNumberFromHash(hash)).toBeNull();
	});
});

describe('shareLink', () => {
	it('opens the system share sheet when the browser has one', async () => {
		const { device, writeText } = clipboardDevice();
		const share = vi.fn().mockResolvedValue(undefined);

		await expect(shareLink(LINK, { ...device, share })).resolves.toBe(
			'shared'
		);

		expect(share).toHaveBeenCalledWith(LINK);
		expect(writeText).not.toHaveBeenCalled();
	});

	it('copies the link when the browser has no share sheet', async () => {
		const { device, writeText } = clipboardDevice();

		await expect(shareLink(LINK, device)).resolves.toBe('copied');

		expect(writeText).toHaveBeenCalledWith(LINK.url);
	});

	it('copies nothing when the user closes the share sheet', async () => {
		const { device, writeText } = clipboardDevice();
		const dismissed = Object.assign(new Error('dismissed'), {
			name: 'AbortError',
		});
		const share = vi.fn().mockRejectedValue(dismissed);

		await expect(shareLink(LINK, { ...device, share })).resolves.toBe(
			'cancelled'
		);

		expect(writeText).not.toHaveBeenCalled();
	});

	it('falls back to copying when the share sheet fails', async () => {
		const { device, writeText } = clipboardDevice();
		const share = vi.fn().mockRejectedValue(new Error('NotAllowedError'));

		await expect(shareLink(LINK, { ...device, share })).resolves.toBe(
			'copied'
		);

		expect(writeText).toHaveBeenCalledWith(LINK.url);
	});

	it('lets a refused clipboard surface to the caller', async () => {
		const writeText = vi.fn().mockRejectedValue(new Error('denied'));
		const device = { clipboard: { writeText } as unknown as Clipboard };

		await expect(shareLink(LINK, device)).rejects.toThrow('denied');
	});
});
