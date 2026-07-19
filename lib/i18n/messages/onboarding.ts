const fr = {
	title: 'Complète ton profil',
	subtitle: 'Encore une étape avant de plonger dans ReelMark.',
	usernameLabel: 'Pseudo',
	usernameHint:
		'Lettres, chiffres et underscores. Tu pourras le changer plus tard.',
	regionLabel: 'Pays',
	regionHint:
		'Utilisé pour les plateformes de streaming et les certifications de ton pays.',
	submit: 'Continuer',
	submitting: 'Enregistrement...',
};

const en = {
	title: 'Complete your profile',
	subtitle: 'One last step before diving into ReelMark.',
	usernameLabel: 'Username',
	usernameHint: 'Letters, numbers and underscores. You can change it later.',
	regionLabel: 'Country',
	regionHint:
		'Used for streaming platforms and certifications in your country.',
	submit: 'Continue',
	submitting: 'Saving...',
} satisfies typeof fr;

export const onboarding = { fr, en };
