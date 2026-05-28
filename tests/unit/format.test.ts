import { describe, it, expect } from 'vitest';
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
