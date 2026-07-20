'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	savePushSubscription,
	deletePushSubscription,
} from '@/app/actions/push';
import { reportSwallowed } from '@/lib/report';

type PushStatus =
	'loading' | 'unsupported' | 'ios-needs-install' | 'off' | 'on';

/**
 * Inlinée au build. Absente si le build n'a pas reçu le build-arg : le toggle doit alors
 * se présenter comme indisponible plutôt que de rester actif sans effet.
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
	const padded = base64.padEnd(
		base64.length + ((4 - (base64.length % 4)) % 4),
		'='
	);
	const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
	const bytes = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
	return bytes;
}

function isStandalone(): boolean {
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in navigator &&
			(navigator as { standalone?: boolean }).standalone === true)
	);
}

function isIOS(): boolean {
	const isIPadOS =
		navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
	return /iPad|iPhone|iPod/.test(navigator.userAgent) || isIPadOS;
}

function toSubscriptionInput(subscription: PushSubscription) {
	const json = subscription.toJSON();
	return {
		endpoint: subscription.endpoint,
		p256dh: json.keys?.p256dh ?? '',
		auth: json.keys?.auth ?? '',
		userAgent: navigator.userAgent,
	};
}

/**
 * Manages this device's web push subscription: current state, opt-in and opt-out.
 * iOS only exposes the Push API once the PWA is installed to the home screen.
 */
export function usePushSubscription() {
	const [status, setStatus] = useState<PushStatus>('loading');
	const [isPending, setIsPending] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function resolveStatus(): Promise<PushStatus> {
			if (!VAPID_PUBLIC_KEY) return 'unsupported';

			if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
				return isIOS() && !isStandalone()
					? 'ios-needs-install'
					: 'unsupported';
			}
			try {
				const registration = await navigator.serviceWorker.ready;
				const subscription =
					await registration.pushManager.getSubscription();
				return subscription ? 'on' : 'off';
			} catch {
				return 'unsupported';
			}
		}

		void resolveStatus().then((resolved) => {
			if (!cancelled) setStatus(resolved);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	const enable = useCallback(async () => {
		if (!VAPID_PUBLIC_KEY) return;

		setIsPending(true);
		try {
			if ((await Notification.requestPermission()) !== 'granted') return;

			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
			});

			await savePushSubscription(toSubscriptionInput(subscription));
			setStatus('on');
		} catch (error) {
			reportSwallowed('push:enable', error);
		} finally {
			setIsPending(false);
		}
	}, []);

	const disable = useCallback(async () => {
		setIsPending(true);
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription =
				await registration.pushManager.getSubscription();
			if (subscription) {
				await deletePushSubscription(subscription.endpoint);
				await subscription.unsubscribe();
			}
			setStatus('off');
		} catch (error) {
			reportSwallowed('push:disable', error);
		} finally {
			setIsPending(false);
		}
	}, []);

	return { status, isPending, enable, disable };
}
