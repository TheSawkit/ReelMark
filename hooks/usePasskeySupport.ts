'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** True when the browser exposes the WebAuthn API passkeys rely on; false during SSR. */
export function usePasskeySupport(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => typeof window !== 'undefined' && !!window.PublicKeyCredential,
		() => false
	);
}
