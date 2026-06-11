import { describe, it, expect } from 'vitest';
import { resolveAvatarUrl } from '@/lib/avatar';

describe('resolveAvatarUrl', () => {
	it('prefers the custom avatar over the provider fallback', () => {
		expect(
			resolveAvatarUrl('https://cdn/custom.png', 'https://google/p')
		).toBe('https://cdn/custom.png');
	});

	it('falls back to the provider avatar when no custom one exists', () => {
		expect(resolveAvatarUrl(null, 'https://google/p')).toBe(
			'https://google/p'
		);
		expect(resolveAvatarUrl('', 'https://google/p')).toBe(
			'https://google/p'
		);
	});

	it('returns null when neither is a usable string', () => {
		expect(resolveAvatarUrl(null, null)).toBeNull();
		expect(resolveAvatarUrl('', '')).toBeNull();
		expect(resolveAvatarUrl(undefined, undefined)).toBeNull();
		expect(resolveAvatarUrl(42, {})).toBeNull();
	});
});
