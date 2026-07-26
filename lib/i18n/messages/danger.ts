const fr = {
	warning: '⚠️ Avertissement important',
	allDataWillBeDeleted: 'Toutes tes données seront supprimées définitivement',
	accountCannotBeRecovered: 'Ton compte ne pourra pas être récupéré',
	actionCannotBeUndone: 'Cette action ne peut pas être annulée',
	willBeLoggedOut: 'Tu seras déconnecté immédiatement',
	typeToConfirm: 'Tape "SUPPRIMER" pour confirmer',
	confirmPlaceholder: 'SUPPRIMER',
	additionalWarning:
		"Cette action est irréversible. Assure-toi d'avoir sauvegardé tes données.",
	deleting: 'Suppression...',
};

const en = {
	warning: '⚠️ Important warning',
	allDataWillBeDeleted: 'All your data will be permanently deleted',
	accountCannotBeRecovered: 'Your account cannot be recovered',
	actionCannotBeUndone: 'This action cannot be undone',
	willBeLoggedOut: 'You will be logged out immediately',
	typeToConfirm: 'Type "DELETE" to confirm',
	confirmPlaceholder: 'DELETE',
	additionalWarning:
		'This action is irreversible. Make sure you have backed up your data.',
	deleting: 'Deleting...',
} satisfies typeof fr;

export const danger = { fr, en };
