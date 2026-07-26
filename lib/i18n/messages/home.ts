const fr = {
	features: {
		title: 'Pourquoi ReelMark ?',
	},
	cta: {
		title: 'Prêt à commencer ?',
		subtitle:
			'Rejoins la communauté de cinéphiles et commence à tracker tes films favoris dès maintenant.',
		button: 'Créer un compte gratuitement',
		alreadyHave: "J'ai déjà un compte",
	},
	preview: {
		title: 'Tout le cinéma, au même endroit',
		subtitle:
			'Des milliers de films et séries à suivre, noter et organiser.',
	},
};

const en = {
	features: {
		title: 'Why ReelMark?',
	},
	cta: {
		title: 'Ready to get started?',
		subtitle:
			'Join the movie lovers community and start tracking your favorite films right now.',
		button: 'Create a free account',
		alreadyHave: 'I already have an account',
	},
	preview: {
		title: 'All of cinema, in one place',
		subtitle: 'Thousands of movies and shows to track, rate and organize.',
	},
} satisfies typeof fr;

export const home = { fr, en };
