import { describe, it, expect } from 'vitest';
import { dayPartOf, pickGreeting, type GreetingLines } from '@/lib/greeting';
import { translations } from '@/lib/i18n/translations';

const lines: GreetingLines = {
	morning: ['Bonjour, {name} A', 'Bonjour, {name} B'],
	afternoon: ['Bonjour, {name} C'],
	evening: ['Bonsoir, {name} D', 'Bonsoir, {name} E'],
	night: ['Bonsoir, {name} F'],
};

describe('dayPartOf', () => {
	it('says good morning from 5 am, good evening from 6 pm, night from 11 pm', () => {
		expect(dayPartOf(4)).toBe('night');
		expect(dayPartOf(5)).toBe('morning');
		expect(dayPartOf(11)).toBe('morning');
		expect(dayPartOf(12)).toBe('afternoon');
		expect(dayPartOf(17)).toBe('afternoon');
		expect(dayPartOf(18)).toBe('evening');
		expect(dayPartOf(22)).toBe('evening');
		expect(dayPartOf(23)).toBe('night');
	});
});

describe('pickGreeting', () => {
	it('uses a line of the current day part with the user name', () => {
		expect(pickGreeting(lines, 'evening', 'Sawkit', () => 0)).toBe(
			'Bonsoir, Sawkit D'
		);
	});

	it('never repeats the previous line when another one exists', () => {
		const previous = 'Bonsoir, Sawkit D';
		for (const roll of [0, 0.3, 0.6, 0.99]) {
			expect(
				pickGreeting(lines, 'evening', 'Sawkit', () => roll, previous)
			).toBe('Bonsoir, Sawkit E');
		}
	});

	it('keeps the only line of a day part even if it was the previous one', () => {
		expect(
			pickGreeting(
				lines,
				'night',
				'Sawkit',
				() => 0.5,
				'Bonsoir, Sawkit F'
			)
		).toBe('Bonsoir, Sawkit F');
	});
});

describe('greeting translations', () => {
	it('greets by day part and names the user in every line, in both languages', () => {
		for (const lang of ['fr', 'en'] as const) {
			const { greetings } = translations[lang].pages.dashboard;
			for (const part of [
				'morning',
				'afternoon',
				'evening',
				'night',
			] as const) {
				expect(greetings[part].length).toBeGreaterThanOrEqual(3);
				for (const line of greetings[part]) {
					expect(line).toContain('{name}');
				}
			}
			expect(greetings.neutral).toContain('{name}');
		}
	});

	it('says bonjour by day and bonsoir in the evening in French', () => {
		const { greetings } = translations.fr.pages.dashboard;
		for (const line of [...greetings.morning, ...greetings.afternoon]) {
			expect(line.startsWith('Bonjour')).toBe(true);
		}
		for (const line of greetings.evening) {
			expect(line.startsWith('Bonsoir')).toBe(true);
		}
	});
});
