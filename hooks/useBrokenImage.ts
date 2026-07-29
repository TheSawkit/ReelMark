'use client';

import { useState } from 'react';

/**
 * Tracks which image source failed to load so a dead URL falls back to a local placeholder.
 * Keying on the source itself means a later `src` retries instead of staying broken.
 */
export function useBrokenImage(src: string | null | undefined) {
	const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

	return {
		isBroken: Boolean(src) && brokenSrc === src,
		onError: () => setBrokenSrc(src ?? null),
	};
}
