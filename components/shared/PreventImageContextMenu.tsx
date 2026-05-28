'use client';

import { useEffect } from 'react';

export function PreventImageContextMenu() {
	useEffect(() => {
		const handler = (event: MouseEvent) => {
			if ((event.target as HTMLElement | null)?.tagName === 'IMG') {
				event.preventDefault();
			}
		};
		window.addEventListener('contextmenu', handler);
		return () => window.removeEventListener('contextmenu', handler);
	}, []);

	return null;
}
