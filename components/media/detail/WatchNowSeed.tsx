'use client';

import { useEffect } from 'react';
import { watchNowStore } from '@/lib/watch-now-store';
import type { WatchNowOption } from '@/lib/watch-now';

/** Hands the server-resolved play options to every `WatchNowSlot` of the page. */
export function WatchNowSeed({ options }: { options: WatchNowOption[] }) {
	useEffect(() => {
		watchNowStore.seed(options);
		return () => watchNowStore.release(options);
	}, [options]);

	return null;
}
