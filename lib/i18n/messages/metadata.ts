const fr = {
	defaultMovieDescription: 'Suis et découvre des films sur ReelMark',
	defaultTvDescription: 'Suis et découvre des séries sur ReelMark',
	defaultCrewDescription:
		'Explore les artistes et leur filmographie sur ReelMark',
	watchMovieOn: 'Regarde ${title} sur ReelMark',
	watchShowOn: 'Regarde ${title} sur ReelMark',
	exploreCrewOn: 'Explore la filmographie de ${name} sur ReelMark',
	dashboardTitle: 'Tableau de bord',
	dashboardDescription:
		'Accède à ton tableau de bord personnel avec tes recommandations et ton historique de visionnage.',
	explorerTitle: 'Explorateur',
	explorerDescription:
		'Découvre des films et séries à ajouter à ta collection.',
	libraryDescription:
		'Ta bibliothèque personnelle de films et séries à regarder ou déjà vus.',
	loginTitle: 'Connexion',
	loginDescription:
		'Connecte-toi à ton compte ReelMark pour suivre tes films et séries.',
	signupTitle: 'Inscription',
	signupDescription:
		'Crée ton compte ReelMark et commence à suivre tes films et séries.',
	landingTitle: 'ReelMark — Ton suivi de films et séries',
	landingDescription:
		'Suis, organise et découvre tous les films et séries que tu as regardés ou veux regarder.',
	profileDescription:
		'Découvre le profil de @${username} sur ReelMark — watchlist, avis et plus.',
	playlistDescription: 'Playlist de @${owner} sur ReelMark',
	authErrorTitle: "Erreur d'authentification",
	authErrorDescription:
		'Une erreur est survenue lors de la connexion. Retourne à la page de connexion pour réessayer.',
	categories: {
		popularMovies:
			'Découvre les films et séries TV les plus populaires du moment sur ReelMark.',
		topRatedMovies:
			'Explore les films les mieux notés de tous les temps sur ReelMark.',
		upcomingMovies:
			'Découvre les films à venir et attendus prochainement sur ReelMark.',
		nowPlayingMovies:
			'Regarde les films actuellement en salles sur ReelMark.',
		trendingMovies:
			'Découvre les films qui font tendance cette semaine sur ReelMark.',
		tvPopular:
			'Découvre les séries TV les plus populaires du moment sur ReelMark.',
		tvTopRated:
			'Explore les séries TV les mieux notées de tous les temps sur ReelMark.',
		tvTrending:
			'Découvre les séries TV qui font tendance cette semaine sur ReelMark.',
		tvAiringToday:
			"Regarde les séries TV diffusées aujourd'hui sur ReelMark.",
		tvOnTheAir:
			'Découvre les séries TV actuellement en diffusion sur ReelMark.',
	},
};

const en = {
	defaultMovieDescription: 'Track and discover movies on ReelMark',
	defaultTvDescription: 'Track and discover TV shows on ReelMark',
	defaultCrewDescription: 'Explore crew and their filmography on ReelMark',
	watchMovieOn: 'Watch ${title} on ReelMark',
	watchShowOn: 'Watch ${title} on ReelMark',
	exploreCrewOn: "Explore ${name}'s filmography on ReelMark",
	dashboardTitle: 'Dashboard',
	dashboardDescription:
		'Access your personal dashboard with recommendations and watch history.',
	explorerTitle: 'Explorer',
	explorerDescription:
		'Discover movies and TV shows to add to your collection.',
	libraryDescription:
		'Your personal library of movies and TV shows to watch or already seen.',
	loginTitle: 'Log in',
	loginDescription:
		'Log in to your ReelMark account to track your movies and TV shows.',
	signupTitle: 'Sign up',
	signupDescription:
		'Create your ReelMark account and start tracking your movies and TV shows.',
	landingTitle: 'ReelMark — Your personal movie & TV tracker',
	landingDescription:
		'Track, organize and discover all the movies and TV shows you have watched or want to watch.',
	profileDescription:
		"Discover @${username}'s profile on ReelMark — watchlist, reviews and more.",
	playlistDescription: 'Playlist by @${owner} on ReelMark',
	authErrorTitle: 'Authentication error',
	authErrorDescription:
		'An error occurred during login. Go back to the login page to try again.',
	categories: {
		popularMovies:
			'Discover the most popular movies and TV shows right now on ReelMark.',
		topRatedMovies:
			'Explore the highest rated movies of all time on ReelMark.',
		upcomingMovies:
			'Discover upcoming and highly anticipated movies on ReelMark.',
		nowPlayingMovies: 'Watch movies currently in theaters on ReelMark.',
		trendingMovies:
			'Discover movies that are trending this week on ReelMark.',
		tvPopular: 'Discover the most popular TV shows right now on ReelMark.',
		tvTopRated:
			'Explore the highest rated TV shows of all time on ReelMark.',
		tvTrending:
			'Discover TV shows that are trending this week on ReelMark.',
		tvAiringToday: 'Watch TV shows airing today on ReelMark.',
		tvOnTheAir: 'Discover TV shows currently on the air on ReelMark.',
	},
} satisfies typeof fr;

export const metadata = { fr, en };
