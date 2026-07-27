import { describe, expect, it } from 'vitest';
import {
	isSameProvider,
	normalizeName,
	providerNameKey,
} from '@/lib/provider-identity';

describe('providerNameKey', () => {
	it('folds the spellings a service is known by onto one key', () => {
		expect(providerNameKey('HBO Max')).toBe('max');
		expect(providerNameKey('Max')).toBe('max');
		expect(providerNameKey('Amazon Prime')).toBe('amazonprimevideo');
		expect(providerNameKey('Amazon Prime Video')).toBe('amazonprimevideo');
	});

	it('resolves a short spelling and its full name to the same key', () => {
		for (const [short, full] of [
			['Paramount', 'Paramount Plus'],
			['Peacock', 'Peacock Premium'],
			['Now', 'Now TV'],
			['Disney', 'Disney Plus'],
		]) {
			expect(providerNameKey(short)).toBe(providerNameKey(full));
		}
	});

	it('leaves an unaliased name at its normalized form', () => {
		expect(providerNameKey('Netflix')).toBe('netflix');
		expect(providerNameKey('Crunchyroll')).toBe('crunchyroll');
	});
});

describe('normalizeName', () => {
	it('strips case and every non-alphanumeric character', () => {
		expect(normalizeName('Apple TV+')).toBe('appletv');
		expect(normalizeName('  Rakuten-TV  ')).toBe('rakutentv');
	});
});

describe('isSameProvider', () => {
	it('matches across spellings and suffixed variants', () => {
		expect(isSameProvider('HBO Max', 'Max')).toBe(true);
		expect(isSameProvider('Netflix Standard with Ads', 'Netflix')).toBe(
			true
		);
	});

	it('refuses to match two short unrelated names', () => {
		expect(isSameProvider('OCS', 'OCS Go')).toBe(false);
	});
});
