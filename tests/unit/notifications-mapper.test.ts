import { describe, it, expect } from 'vitest';
import { notificationMessage, rowToAppNotification } from '@/lib/notifications';
import type { AppNotification } from '@/types/notifications';

const T = {
	friend_request: "{user} vous a envoyé une demande d'ami",
	friend_accepted: "{user} a accepté votre demande d'ami",
	new_episode: 'Nouvel épisode de {title} : S{season}E{episode}',
	suggestion: 'Suggestion : {title}',
};

const base: AppNotification = {
	id: '1',
	type: 'friend_request',
	senderUsername: 'neo',
	senderAvatarUrl: null,
	mediaId: null,
	mediaType: null,
	mediaTitle: null,
	posterPath: null,
	seasonNumber: null,
	episodeNumber: null,
	url: '/profile/neo',
	readAt: null,
	createdAt: '',
};

describe('notificationMessage', () => {
	it("rend une demande d'ami", () => {
		expect(notificationMessage(base, T)).toBe(
			"neo vous a envoyé une demande d'ami"
		);
	});
	it('rend un nouvel épisode', () => {
		const n = {
			...base,
			type: 'new_episode' as const,
			mediaTitle: 'Dark',
			seasonNumber: 2,
			episodeNumber: 5,
		};
		expect(notificationMessage(n, T)).toBe('Nouvel épisode de Dark : S2E5');
	});
});

const row = {
	id: '1',
	type: 'friend_request',
	sender_username: 'neo',
	media_id: null,
	media_type: null,
	media_title: null,
	poster_path: null,
	season_number: null,
	episode_number: null,
	url: '/profile/neo',
	read_at: null,
	created_at: '2026-07-28T00:00:00.000Z',
};

describe('rowToAppNotification', () => {
	it("porte l'avatar de l'expéditeur quand l'appelant a pu le résoudre", () => {
		const avatar = 'https://example.com/neo.jpg';
		expect(rowToAppNotification(row, avatar).senderAvatarUrl).toBe(avatar);
	});

	it("retombe sur null quand l'avatar est inconnu, sans casser le mapping", () => {
		const n = rowToAppNotification(row);
		expect(n.senderAvatarUrl).toBeNull();
		expect(n.senderUsername).toBe('neo');
		expect(n.url).toBe('/profile/neo');
	});
});
