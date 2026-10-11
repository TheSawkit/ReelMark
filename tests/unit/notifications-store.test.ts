import { describe, it, expect, beforeEach } from 'vitest';
import {
	applyNotificationChanges,
	notificationsStore,
	unreadNotificationCount,
} from '@/lib/stores/notifications';
import type { AppNotification, OptimisticChange } from '@/types/notifications';

const SERVER_COUNT = 3;

function notification(id: string): AppNotification {
	return {
		id,
		type: 'friend_request',
		senderUsername: 'neo',
		senderAvatarUrl: null,
		mediaId: null,
		mediaType: null,
		mediaTitle: null,
		posterPath: null,
		seasonNumber: null,
		episodeNumber: null,
		url: null,
		readAt: null,
		createdAt: '2026-07-01T10:00:00.000Z',
	};
}

const first = notification('first');
const second = notification('second');

function started(change: OptimisticChange | null): OptimisticChange {
	expect(change).not.toBeNull();
	return change!;
}

let user = 0;
let userId = '';

function shownCount(owner = userId): number {
	return unreadNotificationCount(SERVER_COUNT, owner);
}

function isSeen(item: AppNotification): boolean {
	return applyNotificationChanges([item])[0]?.readAt != null;
}

beforeEach(() => {
	user += 1;
	userId = `user-${user}`;
	notificationsStore.adopt(userId);
	notificationsStore.setUnreadCount(SERVER_COUNT, userId);
});

describe('badge', () => {
	it('drops by one when a notification is marked seen, and comes back if the write fails', () => {
		const change = started(notificationsStore.markSeen('first'));
		expect(shownCount()).toBe(2);

		change.undo();

		expect(shownCount()).toBe(3);
	});

	it('only drops for a deleted notification that was still unseen', () => {
		notificationsStore.remove('first', false);
		expect(shownCount()).toBe(3);

		notificationsStore.remove('second', true);
		expect(shownCount()).toBe(2);
	});

	it('lets the server count overwrite any local estimate', () => {
		notificationsStore.markSeen('first');

		notificationsStore.setUnreadCount(5, userId);

		expect(shownCount()).toBe(5);
	});

	it('never goes below zero', () => {
		notificationsStore.setUnreadCount(0, userId);

		notificationsStore.markSeen('first');

		expect(shownCount()).toBe(0);
	});

	it('drops a re-read answered for a user who is no longer signed in', () => {
		notificationsStore.adopt('someone-else');

		notificationsStore.setUnreadCount(9, userId);

		expect(unreadNotificationCount(SERVER_COUNT, 'someone-else')).toBe(3);
	});

	it('shows another user only their own server count', () => {
		expect(unreadNotificationCount(7, 'someone-else')).toBe(7);
	});
});

describe('switching users', () => {
	it('starts another user from a clean slate', () => {
		notificationsStore.remove('first', true);

		notificationsStore.adopt('someone-else');

		expect(applyNotificationChanges([first])).toEqual([first]);
		expect(unreadNotificationCount(7, 'someone-else')).toBe(7);
	});

	it('keeps the writes of the same user across a remount', () => {
		notificationsStore.remove('first', true);

		notificationsStore.adopt(userId);

		expect(applyNotificationChanges([first, second])).toEqual([second]);
	});
});

describe('mark all as seen', () => {
	it('empties the badge and shows seen every unseen row a list displayed', () => {
		notificationsStore.rememberListed([first]);

		started(notificationsStore.markAllSeen()).confirm?.();

		expect(shownCount()).toBe(0);
		expect(isSeen(first)).toBe(true);
		expect(isSeen(second)).toBe(false);
	});

	it('covers a row listed while the write was on its way', () => {
		const change = started(notificationsStore.markAllSeen());
		notificationsStore.rememberListed([second]);

		change.confirm?.();

		expect(isSeen(second)).toBe(true);
	});

	it('restores the badge and the rows when it fails', () => {
		notificationsStore.rememberListed([first]);

		started(notificationsStore.markAllSeen()).undo();

		expect(shownCount()).toBe(3);
		expect(isSeen(first)).toBe(false);
	});

	it('keeps a row seen by its own click when "mark all" fails', () => {
		notificationsStore.rememberListed([first]);
		started(notificationsStore.markSeen('first')).confirm?.();

		started(notificationsStore.markAllSeen()).undo();

		expect(isSeen(first)).toBe(true);
	});

	it('re-marks a row whose own click failed while "mark all" was on its way', () => {
		notificationsStore.rememberListed([first]);
		const single = started(notificationsStore.markSeen('first'));
		const all = started(notificationsStore.markAllSeen());

		single.undo();
		all.confirm?.();

		expect(isSeen(first)).toBe(true);
	});
});

describe('nothing to mark', () => {
	it('sends no "mark all" when the badge is empty and every listed row is seen', () => {
		notificationsStore.setUnreadCount(0, userId);
		notificationsStore.rememberListed([first]);
		started(notificationsStore.markSeen('first'));

		expect(notificationsStore.markAllSeen()).toBeNull();
	});
});

describe('repeated writes', () => {
	it('starts a single write when the same notification is marked twice', () => {
		started(notificationsStore.markSeen('first'));

		expect(notificationsStore.markSeen('first')).toBeNull();
	});

	it('starts a single write when the same notification is deleted twice', () => {
		started(notificationsStore.remove('first', true));

		expect(notificationsStore.remove('first', true)).toBeNull();
	});
});

describe('applyNotificationChanges', () => {
	it('returns the server list untouched when nothing was written', () => {
		expect(applyNotificationChanges([first, second])).toEqual([
			first,
			second,
		]);
	});

	it('shows a notification seen wherever it is listed', () => {
		notificationsStore.markSeen('second');

		expect(isSeen(first)).toBe(false);
		expect(isSeen(second)).toBe(true);
	});

	it('hides a removed notification', () => {
		notificationsStore.remove('second', true);

		expect(applyNotificationChanges([first, second])).toEqual([first]);
	});
});
