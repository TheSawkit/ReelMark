'use client';

import { useEffect } from 'react';

/** WebKit-only gesture events: Safari zooms the viewport outside touch-action, so CSS alone leaves pinch working on iOS. */
const GESTURE_EVENTS = ['gesturestart', 'gesturechange', 'gestureend'];

/** Locks pinch-to-zoom on iOS, where `touch-action` and `user-scalable=no` are both ignored for viewport zoom. */
export function PreventPinchZoom() {
	useEffect(() => {
		const block = (event: Event) => event.preventDefault();

		for (const name of GESTURE_EVENTS) {
			document.addEventListener(name, block, { passive: false });
		}
		return () => {
			for (const name of GESTURE_EVENTS) {
				document.removeEventListener(name, block);
			}
		};
	}, []);

	return null;
}
