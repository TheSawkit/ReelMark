import { describe, it, expect, afterEach } from 'vitest';
import {
	formatDate,
	formatShortDate,
	formatRuntime,
	calculateAge,
} from '@/lib/format';

describe('formatRuntime', () => {
	it('formats hours and minutes', () => {
		expect(formatRuntime(135)).toBe('2h 15min');
		expect(formatRuntime(120)).toBe('2h 0min');
		expect(formatRuntime(60)).toBe('1h 0min');
	});

	it('formats minutes only when under 1 hour', () => {
		expect(formatRuntime(45)).toBe('45min');
		expect(formatRuntime(1)).toBe('1min');
	});

	it('returns empty string for 0 or negative', () => {
		expect(formatRuntime(0)).toBe('');
		expect(formatRuntime(-5)).toBe('');
	});
});

describe('formatDate', () => {
	it('returns null for null input', () => {
		expect(formatDate(null, 'en-US')).toBeNull();
	});

	it('returns a string for valid date', () => {
		const result = formatDate('2023-07-15', 'en-US');
		expect(typeof result).toBe('string');
		expect(result).toContain('2023');
	});
});

describe('formatShortDate', () => {
	it('returns a string for valid date', () => {
		const result = formatShortDate('2023-07-15', 'en-US');
		expect(typeof result).toBe('string');
		expect(result).toContain('2023');
	});
});

describe('calculateAge', () => {
	it('returns null when birthday is null', () => {
		expect(calculateAge(null, null)).toBeNull();
	});

	it('calculates age between two dates', () => {
		expect(calculateAge('1950-06-01', '2010-06-01')).toBe(60);
	});

	it('returns a non-negative number for living persons', () => {
		const age = calculateAge('1990-01-01', null);
		expect(typeof age).toBe('number');
		expect(age).toBeGreaterThan(0);
	});
});

describe('déterminisme des dates (hydratation)', () => {
	const ORIGINAL_TZ = process.env.TZ;

	afterEach(() => {
		process.env.TZ = ORIGINAL_TZ;
	});

	/**
	 * Un serveur en UTC et un navigateur en heure locale doivent produire la même chaîne,
	 * sinon les composants client qui affichent une date cassent l'hydratation.
	 */
	it('rend la même chaîne quel que soit le fuseau du processus', () => {
		const timestamp = '2023-07-15T23:30:00.000Z';
		const rendus = new Set<string>();

		for (const tz of ['UTC', 'Europe/Brussels', 'America/Los_Angeles']) {
			process.env.TZ = tz;
			rendus.add(formatShortDate(timestamp, 'fr-FR'));
			rendus.add(formatDate(timestamp, 'fr-FR') ?? '');
		}

		expect(rendus.size).toBe(2);
	});

	it("ne décale pas d'un jour une date seule à l'ouest de Greenwich", () => {
		process.env.TZ = 'America/Los_Angeles';
		expect(formatShortDate('2023-07-15', 'en-GB')).toContain('15');
	});
});
