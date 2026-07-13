'use client';

import { useEffect, useState } from 'react';

export interface GridColumns {
	base: number;
	sm?: number;
	md?: number;
	lg?: number;
	xl?: number;
}

const BREAKPOINTS = [
	{ key: 'xl', minWidth: 1280 },
	{ key: 'lg', minWidth: 1024 },
	{ key: 'md', minWidth: 768 },
	{ key: 'sm', minWidth: 640 },
] as const;

function resolve(config: GridColumns): number {
	for (const bp of BREAKPOINTS) {
		const cols = config[bp.key];
		if (
			cols &&
			window.matchMedia(`(min-width: ${bp.minWidth}px)`).matches
		) {
			return cols;
		}
	}
	return config.base;
}

/** Current column count of a responsive grid, mirroring Tailwind breakpoints; pass a module-level config so the listener stays stable. */
export function useGridColumns(config: GridColumns): number {
	const [cols, setCols] = useState(config.base);

	useEffect(() => {
		const update = () => setCols(resolve(config));
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [config]);

	return cols;
}
