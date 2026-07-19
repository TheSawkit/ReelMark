const fr = {
	defaultMovieDescription: 'Suivez et découvrez des films sur ReelMark',
	defaultTvDescription: 'Suivez et découvrez des séries sur ReelMark',
	defaultCrewDescription:
		'Explorez les artistes et leur filmographie sur ReelMark',
	watchMovieOn: 'Regardez ${title} sur ReelMark',
	watchShowOn: 'Regardez ${title} sur ReelMark',
	exploreCrewOn: 'Explorez la filmographie de ${name} sur ReelMark',
	dashboardTitle: 'Tableau de bord',
	dashboardDescription:
		'Accédez à votre tableau de bord personnel avec vos recommandations et votre historique de visionnage.',
	explorerTitle: 'Explorateur',
	explorerDescription:
		'Découvrez des films et séries à ajouter à votre collection.',
	libraryDescription:
		'Votre bibliothèque personnelle de films et séries à regarder ou déjà vus.',
	loginTitle: 'Connexion',
	loginDescription:
		'Connectez-vous à votre compte ReelMark pour suivre vos films et séries.',
	signupTitle: 'Inscription',
	signupDescription:
		'Créez votre compte ReelMark et commencez à suivre vos films et séries.',
	landingTitle: 'ReelMark — Votre suivi de films et séries',
	landingDescription:
		'Suivez, organisez et découvrez tous les films et séries que vous avez regardés ou voulez regarder.',
	profileDescription:
		'Découvrez le profil de @${username} sur ReelMark — watchlist, avis et plus.',
	playlistDescription: 'Playlist de @${owner} sur ReelMark',
	authErrorTitle: "Erreur d'authentification",
	authErrorDescription:
		'Une erreur est survenue lors de la connexion. Retournez à la page de connexion pour réessayer.',
	categories: {
		popularMovies:
			'Découvrez les films et séries TV les plus populaires du moment sur ReelMark.',
		topRatedMovies:
			'Explorez les films les mieux notés de tous les temps sur ReelMark.',
		upcomingMovies:
			'Découvrez les films à venir et attendus prochainement sur ReelMark.',
		nowPlayingMovies:
			'Regardez les films actuellement en salles sur ReelMark.',
		trendingMovies:
			'Découvrez les films qui font tendance cette semaine sur ReelMark.',
		tvPopular:
			'Découvrez les séries TV les plus populaires du moment sur ReelMark.',
		tvTopRated:
			'Explorez les séries TV les mieux notées de tous les temps sur ReelMark.',
		tvTrending:
			'Découvrez les séries TV qui font tendance cette semaine sur ReelMark.',
		tvAiringToday:
			"Regardez les séries TV diffusées aujourd'hui sur ReelMark.",
		tvOnTheAir:
			'Découvrez les séries TV actuellement en diffusion sur ReelMark.',
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
