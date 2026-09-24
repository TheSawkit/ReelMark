import { describe, it, expect } from 'vitest';
import imageLoader from '@/lib/image-loader';

const backdrop = 'https://image.tmdb.org/t/p/w1280/abc.jpg';
const poster = 'https://image.tmdb.org/t/p/w500/abc.jpg';

describe('imageLoader', () => {
	it('serves the smallest TMDB size covering the requested width', () => {
		expect(imageLoader({ src: backdrop, width: 750 })).toBe(
			'https://image.tmdb.org/t/p/w780/abc.jpg'
		);
		expect(imageLoader({ src: poster, width: 256 })).toBe(
			'https://image.tmdb.org/t/p/w300/abc.jpg'
		);
	});

	it('never exceeds the size the caller asked for', () => {
		expect(imageLoader({ src: poster, width: 1920 })).toBe(poster);
		expect(imageLoader({ src: backdrop, width: 3840 })).toBe(backdrop);
	});

	it('leaves non-TMDB images untouched', () => {
		for (const src of [
			'/poster-placeholder.svg',
			'https://xyz.supabase.co/storage/v1/object/public/avatars/a.png',
			'https://i.ytimg.com/vi/x/hqdefault.jpg',
		]) {
			expect(imageLoader({ src, width: 640 })).toBe(src);
		}
	});
});
