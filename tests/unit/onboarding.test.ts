import { describe, it, expect } from 'vitest';
import {
	slugifyUsername,
	suggestUsernameFromMetadata,
	pickUniqueUsername,
	needsOnboarding,
} from '@/lib/onboarding';

describe('slugifyUsername', () => {
	it('lowercases and joins words with underscores', () => {
		expect(slugifyUsername('Jean Dupont')).toBe('jean_dupont');
	});

	it('strips accents and diacritics', () => {
		expect(slugifyUsername('José Núñez')).toBe('jose_nunez');
		expect(slugifyUsername('Renée Léa')).toBe('renee_lea');
	});

	it('collapses non-alphanumeric runs and trims underscores', () => {
		expect(slugifyUsername('  John   O\'Brien-Smith ')).toBe(
			'john_o_brien_smith'
		);
	});

	it('truncates to 50 characters without trailing underscore', () => {
		const slug = slugifyUsername('a'.repeat(60));
		expect(slug.length).toBe(50);
		expect(slug.endsWith('_')).toBe(false);
	});

	it('returns empty string when nothing usable remains', () => {
		expect(slugifyUsername('---')).toBe('');
		expect(slugifyUsername('')).toBe('');
	});
});

describe('suggestUsernameFromMetadata', () => {
	it('prefers given_name + family_name', () => {
		expect(
			suggestUsernameFromMetadata(
				{ given_name: 'Jean', family_name: 'Dupont', full_name: 'X' },
				'jean@example.com'
			)
		).toBe('jean_dupont');
	});

	it('falls back to full_name then name', () => {
		expect(
			suggestUsernameFromMetadata({ full_name: 'Marie Curie' }, null)
		).toBe('marie_curie');
		expect(suggestUsernameFromMetadata({ name: 'Ada Lovelace' }, null)).toBe(
			'ada_lovelace'
		);
	});

	it('falls back to the email local part', () => {
		expect(suggestUsernameFromMetadata({}, 'cool.user@gmail.com')).toBe(
			'cool_user'
		);
	});

	it('returns "user" when no source is usable', () => {
		expect(suggestUsernameFromMetadata(null, null)).toBe('user');
		expect(suggestUsernameFromMetadata({ given_name: '***' }, '@x')).toBe(
			'user'
		);
	});
});

describe('pickUniqueUsername', () => {
	it('returns the base when not taken', () => {
		expect(pickUniqueUsername('jean', new Set())).toBe('jean');
	});

	it('appends the first free numeric suffix', () => {
		expect(pickUniqueUsername('jean', new Set(['jean']))).toBe('jean_2');
		expect(
			pickUniqueUsername('jean', new Set(['jean', 'jean_2', 'jean_3']))
		).toBe('jean_4');
	});

	it('compares case-insensitively', () => {
		expect(pickUniqueUsername('Jean', new Set(['jean']))).toBe('Jean_2');
	});
});

describe('needsOnboarding', () => {
	it('never triggers once onboarding is completed', () => {
		expect(needsOnboarding({}, true)).toBe(false);
		expect(needsOnboarding(null, true)).toBe(false);
	});

	it('triggers while region or username is missing', () => {
		expect(needsOnboarding({ username: 'jean' }, false)).toBe(true);
		expect(needsOnboarding({ region: 'FR' }, false)).toBe(true);
		expect(needsOnboarding(null, false)).toBe(true);
	});

	it('does not trigger when both region and username are present', () => {
		expect(
			needsOnboarding({ username: 'jean', region: 'FR' }, false)
		).toBe(false);
	});
});
