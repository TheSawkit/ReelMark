const fr = {
	title: 'Vous êtes hors ligne',
	description: 'Vérifiez votre connexion et réessayez.',
	retry: 'Réessayer',
};

const en = {
	title: 'You are offline',
	description:
		'You are currently offline. Please check your connection and try again.',
	retry: 'Retry',
} satisfies typeof fr;

export const offline = { fr, en };
