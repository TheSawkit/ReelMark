const fr = {
	title: 'Tu es hors ligne',
	description: 'Vérifie ta connexion et réessaie.',
	retry: 'Réessayer',
};

const en = {
	title: 'You are offline',
	description:
		'You are currently offline. Please check your connection and try again.',
	retry: 'Retry',
} satisfies typeof fr;

export const offline = { fr, en };
