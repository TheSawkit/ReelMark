import type { CSSProperties } from 'react';

/** Position of an element in a `.hero-rise` cascade; the delay step itself is the `--duration-stagger` token. */
export function riseStyle(index: number): CSSProperties {
	return { '--rise-index': index } as CSSProperties;
}
