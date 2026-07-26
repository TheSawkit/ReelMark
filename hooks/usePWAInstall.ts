'use client';

import { useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Let the page settle before asking anything. */
const REVEAL_DELAY_MS = 3000;

export type InstallMode = 'prompt' | 'ios-safari' | 'ios-other';

function isStandalone(): boolean {
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in navigator &&
			(navigator as { standalone?: boolean }).standalone === true)
	);
}

function detectIOS(): boolean {
	const ua = navigator.userAgent;
	const isIPadOS =
		navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
	return /iPad|iPhone|iPod/.test(ua) || isIPadOS;
}

/**
 * Every iOS browser runs WebKit, but only Safari itself exposes "Add to Home Screen",
 * so anywhere else the user has to be sent back to Safari first.
 */
function isIOSSafari(): boolean {
	return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo/.test(navigator.userAgent);
}

function isMobile(): boolean {
	return (
		/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
	);
}

/** Whether this device can still install the app, and by which route. */
export function usePWAInstall() {
	const [state, setState] = useState<{ visible: boolean; mode: InstallMode }>(
		{
			visible: false,
			mode: 'prompt',
		}
	);
	const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		if (!isMobile() || isStandalone()) return;

		let timer: ReturnType<typeof setTimeout>;

		if (detectIOS()) {
			const mode: InstallMode = isIOSSafari()
				? 'ios-safari'
				: 'ios-other';
			timer = setTimeout(
				() => setState({ visible: true, mode }),
				REVEAL_DELAY_MS
			);
			return () => clearTimeout(timer);
		}

		const handler = (e: Event) => {
			e.preventDefault();
			promptRef.current = e as BeforeInstallPromptEvent;
			clearTimeout(timer);
			timer = setTimeout(
				() => setState({ visible: true, mode: 'prompt' }),
				REVEAL_DELAY_MS
			);
		};

		window.addEventListener('beforeinstallprompt', handler);
		return () => {
			window.removeEventListener('beforeinstallprompt', handler);
			clearTimeout(timer);
		};
	}, []);

	async function triggerInstall() {
		const prompt = promptRef.current;
		if (!prompt) return;
		await prompt.prompt();
		await prompt.userChoice;
	}

	return { visible: state.visible, mode: state.mode, triggerInstall };
}
