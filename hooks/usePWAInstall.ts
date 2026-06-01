'use client';

import { useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_TTL_DAYS = 30;

function isDismissed(): boolean {
	try {
		const raw = localStorage.getItem(DISMISS_KEY);
		if (!raw) return false;
		return Date.now() - Number(raw) < DISMISS_TTL_DAYS * 86_400_000;
	} catch {
		return false;
	}
}

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

function isMobile(): boolean {
	return (
		/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
	);
}

export function usePWAInstall() {
	const [state, setState] = useState({ visible: false, isIOS: false });
	const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		if (!isMobile() || isStandalone() || isDismissed()) return;

		const ios = detectIOS();
		let timer: ReturnType<typeof setTimeout>;

		if (ios) {
			timer = setTimeout(
				() => setState({ visible: true, isIOS: true }),
				3000
			);
			return () => clearTimeout(timer);
		}

		const handler = (e: Event) => {
			e.preventDefault();
			promptRef.current = e as BeforeInstallPromptEvent;
			timer = setTimeout(
				() => setState({ visible: true, isIOS: false }),
				3000
			);
		};

		window.addEventListener('beforeinstallprompt', handler);
		return () => {
			window.removeEventListener('beforeinstallprompt', handler);
			clearTimeout(timer);
		};
	}, []);

	function dismiss() {
		try {
			localStorage.setItem(DISMISS_KEY, String(Date.now()));
		} catch {}
		setState((s) => ({ ...s, visible: false }));
	}

	async function triggerInstall() {
		const prompt = promptRef.current;
		if (!prompt) return;
		await prompt.prompt();
		const { outcome } = await prompt.userChoice;
		if (outcome === 'accepted') {
			setState((s) => ({ ...s, visible: false }));
		}
	}

	return {
		visible: state.visible,
		isIOS: state.isIOS,
		dismiss,
		triggerInstall,
	};
}
