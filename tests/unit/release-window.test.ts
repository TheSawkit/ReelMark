import { describe, it, expect } from 'vitest';
import {
	THEATRICAL_RELEASE_TYPES,
	inTheatersDates,
	originalReleaseFloor,
	upcomingDates,
} from '@/lib/tmdb/release-window';

const TODAY = new Date('2026-08-02T12:00:00Z');

describe('originalReleaseFloor', () => {
	it("retient l'année en cours et la précédente", () => {
		expect(originalReleaseFloor(TODAY)).toBe('2025-01-01');
	});

	it('suit le passage à la nouvelle année', () => {
		expect(originalReleaseFloor(new Date('2027-01-01T00:00:00Z'))).toBe(
			'2026-01-01'
		);
	});
});

describe('inTheatersDates', () => {
	const dates = inTheatersDates(TODAY);

	it('ouvre la fenêtre six semaines en arrière', () => {
		expect(dates['release_date.gte']).toBe('2026-06-21');
	});

	it('la referme une semaine en avant, pour les avant-premières', () => {
		expect(dates['release_date.lte']).toBe('2026-08-09');
	});

	// Sans ce plancher, TMDB remonte les ressorties de catalogue — The Matrix (1999),
	// Alien (1979) — qui ont bien une séance récente mais une date d'origine ancienne.
	it("plancher la date de sortie d'origine pour écarter les ressorties", () => {
		expect(dates['primary_release_date.gte']).toBe('2025-01-01');
	});
});

describe('upcomingDates', () => {
	const dates = upcomingDates(TODAY);

	it("part d'aujourd'hui", () => {
		expect(dates['release_date.gte']).toBe('2026-08-02');
	});

	it('écarte les ressorties annoncées de vieux titres', () => {
		expect(dates['primary_release_date.gte']).toBe('2025-01-01');
	});

	it('ne borne pas la fin : une sortie lointaine reste annoncée', () => {
		expect(dates['release_date.lte']).toBeUndefined();
	});
});

describe('THEATRICAL_RELEASE_TYPES', () => {
	it('couvre la projection limitée et la sortie nationale', () => {
		expect(THEATRICAL_RELEASE_TYPES).toBe('2|3');
	});
});
