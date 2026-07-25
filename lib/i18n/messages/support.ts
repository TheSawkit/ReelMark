const fr = {
	title: 'Soutenir ReelMark',
	subtitle: 'Gratuit, sans publicité, sans revente de données.',
	intro: "ReelMark est développé et payé par une seule personne, sur son temps libre. L'application restera gratuite et complète pour tout le monde : les dons servent uniquement à couvrir ce qu'elle coûte pour tourner.",
	costsTitle: 'Ce que finance ton don',
	costs: {
		hosting: 'Hébergement des serveurs',
		database: 'Base de données et authentification',
		apis: 'Accès aux APIs de données de films et de séries',
		domain: 'Nom de domaine et certificats',
	},
	noPerksTitle: 'Aucune contrepartie',
	noPerksBody:
		"Un don ne débloque rien : pas de badge, pas de fonctionnalité réservée, pas d'accès anticipé. ReelMark est identique pour les donateurs et pour tous les autres, et le restera.",
	cta: 'Faire un don',
	ctaNote:
		'Le lien ouvre Revolut dans un nouvel onglet. ReelMark ne voit, ne traite et ne conserve aucune donnée de paiement.',
	thanks: 'Merci — même un café, ça compte.',
	nav: 'Soutenir',
	card: {
		title: 'Soutenir ReelMark',
		description:
			"L'application est gratuite et sans publicité. Si elle t'est utile, tu peux aider à couvrir ses frais.",
		link: 'En savoir plus',
	},
};

const en = {
	title: 'Support ReelMark',
	subtitle: 'Free, ad-free, and your data is never sold.',
	intro: 'ReelMark is built and paid for by one person, in their spare time. The app will stay free and complete for everyone: donations only cover what it costs to run.',
	costsTitle: 'What your donation pays for',
	costs: {
		hosting: 'Server hosting',
		database: 'Database and authentication',
		apis: 'Access to movie and TV data APIs',
		domain: 'Domain name and certificates',
	},
	noPerksTitle: 'No perks in return',
	noPerksBody:
		'A donation unlocks nothing: no badge, no reserved feature, no early access. ReelMark is the same for donors and for everyone else, and it will stay that way.',
	cta: 'Donate',
	ctaNote:
		'The link opens Revolut in a new tab. ReelMark never sees, processes, or stores any payment data.',
	thanks: 'Thank you — even a coffee helps.',
	nav: 'Support',
	card: {
		title: 'Support ReelMark',
		description:
			'The app is free and ad-free. If it is useful to you, you can help cover its running costs.',
		link: 'Learn more',
	},
} satisfies typeof fr;

export const support = { fr, en };
