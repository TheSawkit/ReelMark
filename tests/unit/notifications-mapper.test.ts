import { describe, it, expect } from 'vitest';
import { notificationMessage } from '@/lib/notifications';
import type { AppNotification } from '@/types/notifications';

const T = {
	friend_request: "{actor} vous a envoyé une demande d'ami",
	friend_accepted: "{actor} a accepté votre demande d'ami",
	new_episode: 'Nouvel épisode de {title} : S{season}E{episode}',
	suggestion: 'Suggestion : {title}',
};

const base: AppNotification = {
	id: '1',
	type: 'friend_request',
	actorUsername: 'neo',
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
