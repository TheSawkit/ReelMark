const fr = {
	title: 'Notifications',
	empty: 'Aucune notification pour le moment',
	markAllRead: 'Tout marquer comme lu',
	seeAll: 'Voir tout',
	new: 'Nouveau',
	delete: 'Supprimer',
	templates: {
		friend_request: '{user} vous a envoyé une demande d’ami',
		friend_accepted: '{user} a accepté votre demande d’ami',
		new_episode: 'Nouvel épisode de {title} : S{season}E{episode}',
		suggestion: 'À voir : {title}',
	},
};

const en = {
	title: 'Notifications',
	empty: 'No notifications yet',
	markAllRead: 'Mark all as read',
	seeAll: 'See all',
	new: 'New',
	delete: 'Delete',
	templates: {
		friend_request: '{user} sent you a friend request',
		friend_accepted: '{user} accepted your friend request',
		new_episode: 'New episode of {title}: S{season}E{episode}',
		suggestion: 'Worth watching: {title}',
	},
} satisfies typeof fr;

export const notifications = { fr, en };
