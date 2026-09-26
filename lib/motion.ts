import type { CSSProperties } from 'react';

/** Position of an element in a `.hero-rise` cascade; the delay step itself is the `--duration-stagger` token. */
export function riseStyle(index: number): CSSProperties {
	return { '--rise-index': index } as CSSProperties;
}

/**
 * The app's only springs, for Motion components. Durations mirror the `--duration-*` tokens of
 * globals.css so CSS and Motion move in the same tempo; `bounce` is the overshoot (0 = none).
 */
export const SPRING = {
	indicator: { type: 'spring', duration: 0.3, bounce: 0.15 },
	surface: { type: 'spring', duration: 0.4, bounce: 0.1 },
	list: { type: 'spring', duration: 0.3, bounce: 0 },
} as const;

/** Drag distance or flick speed past which a bottom sheet dismisses instead of springing back. */
export const SHEET_DISMISS = { offset: 120, velocity: 500 } as const;
