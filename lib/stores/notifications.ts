'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createSubscription } from '@/lib/stores/factory';
import type { AppNotification, OptimisticChange } from '@/types/notifications';

const count = createSubscription();
const list = createSubscription();

let ownerId: string | null = null;
let unreadCount: number | null = null;

const seenAt = new Map<string, string>();
const removed = new Set<string>();
const listedUnseen = new Set<string>();

function setCount(next: number | null) {
	unreadCount = next === null ? null : Math.max(0, next);
	count.notify();
}

function adjustCount(delta: number) {
	if (unreadCount !== null && delta !== 0) setCount(unreadCount + delta);
}

function markLocally(ids: Iterable<string>): string[] {
	const now = new Date().toISOString();
	const newlySeen: string[] = [];
	for (const id of ids) {
		if (seenAt.has(id)) continue;
		seenAt.set(id, now);
		newlySeen.push(id);
	}
	list.notify();
	return newlySeen;
}

function unmarkLocally(ids: Iterable<string>) {
	for (const id of ids) seenAt.delete(id);
	list.notify();
}

/** The server's list with this session's writes applied, so the bell panel and the notifications page never disagree. */
export function applyNotificationChanges(
	items: AppNotification[]
): AppNotification[] {
	return items
		.filter((item) => !removed.has(item.id))
		.map((item) => {
			const readAt = item.readAt ?? seenAt.get(item.id) ?? null;
			return readAt === item.readAt ? item : { ...item, readAt };
		});
}

/** Unread count shown to `userId`: the client's own value once seeded, the server-rendered one before and for anyone else. */
export function unreadNotificationCount(
	serverCount: number,
	userId: string
): number {
	return ownerId === userId && unreadCount !== null
		? unreadCount
		: serverCount;
}

/** Notification state shared by the navbar bell and the notifications page, which no common provider wraps. */
export const notificationsStore = {
	/** Binds the store to the signed-in user; another user starts from a clean slate. */
	adopt(userId: string) {
		if (ownerId === userId) return;
		const previousOwner = ownerId;
		ownerId = userId;
		if (previousOwner === null) return;
		seenAt.clear();
		removed.clear();
		listedUnseen.clear();
		setCount(null);
		list.notify();
	},

	/** The user the store currently belongs to, so a re-read can tell whether its answer is still theirs. */
	owner(): string | null {
		return ownerId;
	},

	/** Server truth for the badge, from the rendered page or a re-read; it wins over local estimates, but only for the user it was read for. */
	setUnreadCount(serverCount: number, readFor: string | null) {
		if (readFor === ownerId) setCount(serverCount);
	},

	rememberListed(items: AppNotification[]) {
		for (const item of items) if (!item.readAt) listedUnseen.add(item.id);
	},

	markSeen(id: string): OptimisticChange | null {
		if (seenAt.has(id) || removed.has(id)) return null;
		markLocally([id]);
		adjustCount(-1);
		return {
			undo() {
				unmarkLocally([id]);
				adjustCount(1);
			},
		};
	},

	remove(id: string, countedUnseen: boolean): OptimisticChange | null {
		if (removed.has(id)) return null;
		removed.add(id);
		list.notify();
		const change = countedUnseen ? -1 : 0;
		adjustCount(change);
		return {
			undo() {
				removed.delete(id);
				list.notify();
				adjustCount(-change);
			},
		};
	},

	markAllSeen(): OptimisticChange | null {
		const listedStillUnseen = [...listedUnseen].some(
			(id) => !seenAt.has(id)
		);
		if (unreadCount === 0 && !listedStillUnseen) return null;
		const newlySeen = markLocally(listedUnseen);
		const previousCount = unreadCount;
		setCount(0);
		return {
			confirm() {
				markLocally(listedUnseen);
			},
			undo() {
				unmarkLocally(newlySeen);
				setCount(previousCount);
			},
		};
	},
};

/** Reactive `unreadNotificationCount`, so the bell follows a write made anywhere on the page. */
export function useUnreadNotifications(
	serverCount: number,
	userId: string
): number {
	return useSyncExternalStore(
		count.subscribe,
		() => unreadNotificationCount(serverCount, userId),
		() => serverCount
	);
}

/** `applyNotificationChanges` for a rendered list, kept to the server items while hydrating so the HTML matches the server render. */
export function useNotificationChanges(
	serverItems: AppNotification[]
): AppNotification[] {
	const listVersion = useSyncExternalStore(
		list.subscribe,
		list.version,
		() => 0
	);

	useEffect(() => {
		notificationsStore.rememberListed(serverItems);
	}, [serverItems]);

	return listVersion === 0
		? serverItems
		: applyNotificationChanges(serverItems);
}
