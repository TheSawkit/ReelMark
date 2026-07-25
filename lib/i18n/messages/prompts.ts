const fr = {
	dismiss: 'Plus tard',
	push: {
		title: 'Activer les notifications',
		description: 'Sois prévenu dès qu’un nouvel épisode de tes séries sort.',
		action: 'Activer',
	},
	import: {
		title: 'Importer ta bibliothèque',
		description: 'Depuis Letterboxd, Trakt ou un export ReelMark.',
		action: 'Importer',
	},
	streaming: {
		title: 'Tes plateformes de streaming',
		description:
			'Indique tes abonnements pour voir en priorité ce qui est déjà inclus chez toi.',
		action: 'Choisir',
	},
};

const en = {
	dismiss: 'Later',
	push: {
		title: 'Turn on notifications',
		description: 'Get told as soon as a new episode of your shows airs.',
		action: 'Turn on',
	},
	import: {
		title: 'Import your library',
		description: 'From Letterboxd, Trakt, or a ReelMark export.',
		action: 'Import',
	},
	streaming: {
		title: 'Your streaming platforms',
		description:
			'Tell us what you subscribe to and see what is already included first.',
		action: 'Choose',
	},
} satisfies typeof fr;

export const prompts = { fr, en };
