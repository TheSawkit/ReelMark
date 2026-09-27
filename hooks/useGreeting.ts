'use client';

import { useSyncExternalStore } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { dayPartOf, pickGreeting, type GreetingLines } from '@/lib/greeting';

const subscribe = () => () => {};

let current: { key: string; line: string } | undefined;

function localGreeting(lines: GreetingLines, name: string, lang: string) {
	const part = dayPartOf(new Date().getHours());
	const key = `${lang}|${name}|${part}`;
	if (current?.key !== key) {
		const line = pickGreeting(
			lines,
			part,
			name,
			Math.random,
			current?.line
		);
		current = { key, line };
	}
	return current.line;
}

/** Dashboard greeting for the viewer's local time of day, kept for the visit and redrawn when the day part changes; the server, blind to the time zone, renders a neutral line. */
export function useGreeting(name: string): string {
	const { t, lang } = useTranslation();
	const { greetings } = t.pages.dashboard;
	return useSyncExternalStore(
		subscribe,
		() => localGreeting(greetings, name, lang),
		() => greetings.neutral.replace('{name}', name)
	);
}
