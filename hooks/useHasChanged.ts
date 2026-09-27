'use client';

import { useState } from 'react';

/** Whether `value` has differed from its first render — lets an animation skip the server-rendered first paint. */
export function useHasChanged<T>(value: T): boolean {
	const [initial] = useState(value);
	const [hasChanged, setHasChanged] = useState(false);
	if (!hasChanged && value !== initial) setHasChanged(true);
	return hasChanged;
}
