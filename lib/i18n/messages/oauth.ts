const fr = {
	createPasswordTitle: 'Créer un mot de passe',
	createPasswordDescription:
		'Ton compte utilise Google. Ajoute un mot de passe pour pouvoir aussi te connecter par email.',
	createPasswordButton: 'Créer le mot de passe',
	deleteNoPassword:
		'Compte Google : tape le mot-clé ci-dessus pour confirmer la suppression.',
};

const en = {
	createPasswordTitle: 'Create a password',
	createPasswordDescription:
		'Your account uses Google. Add a password so you can also sign in with email.',
	createPasswordButton: 'Create password',
	deleteNoPassword:
		'Google account: type the keyword above to confirm deletion.',
} satisfies typeof fr;

export const oauth = { fr, en };
