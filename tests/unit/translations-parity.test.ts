import { describe, expect, it } from 'vitest';
import { translations } from '@/lib/i18n/translations';

function deepKeys(obj: object, prefix = ''): string[] {
	return Object.entries(obj).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return typeof value === 'object' && value !== null
			? deepKeys(value, path)
			: [path];
	});
}

describe('translations parity', () => {
	it('fr and en expose exactly the same keys', () => {
		expect(deepKeys(translations.en)).toEqual(deepKeys(translations.fr));
	});

	it('every leaf is a non-empty string', () => {
		for (const lang of ['fr', 'en'] as const) {
			const walk = (obj: object): void => {
				for (const value of Object.values(obj)) {
					if (typeof value === 'object' && value !== null)
						walk(value);
					else expect(typeof value).toBe('string');
				}
			};
			walk(translations[lang]);
		}
	});
});
