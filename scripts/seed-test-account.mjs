/**
 * Seeds the E2E test account of a Supabase project built from `supabase/migrations/`.
 *
 *   pnpm seed:test            # local stack (`supabase start`)
 *   pnpm seed:test --remote   # a hosted test project
 *
 * Reads `.env.local`: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL,
 * TEST_USER_PASSWORD. Refuses the production project, and any hosted project without --remote.
 *
 * Idempotent: the three seeded accounts are created once, then their data is wiped and
 * rewritten on every run. Nothing else in the project is touched.
 *
 * What it writes — a library in the shape of a real one, ~70 titles instead of 2 078:
 *   test account   53 movies, 18 shows (to watch / watched / one abandoned), watched episodes
 *                  that leave Breaking Bad, Stranger Things and The Last of Us half-way (the
 *                  "continue watching" row), ratings and reviews, streaming services, a public
 *                  playlist
 *   e2e-friend     an accepted friend with a small public library and two reviews
 *   e2e-requester  a pending friend request to the test account (the invitations card)
 *
 * Titles, posters and genres are public TMDB metadata; the E2E suite relies on 550 (Fight
 * Club), 603 (The Matrix) and 1399 (Game of Thrones).
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const PRODUCTION_PROJECT_REF = 'xdcdbjgbasrfxbuxwbrl';
const DAY_MS = 86_400_000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

function fail(message) {
	console.error(`seed:test — ${message}`);
	process.exit(1);
}

if (!url || !serviceRoleKey || !email || !password)
	fail(
		'NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL and TEST_USER_PASSWORD are required.'
	);

const host = new URL(url).hostname;
if (host.startsWith(PRODUCTION_PROJECT_REF))
	fail('this is the production project. Point .env.local at a test project.');
const isLocal = ['127.0.0.1', 'localhost', 'host.docker.internal'].includes(
	host
);
if (!isLocal && !process.argv.includes('--remote'))
	fail(`${host} is a hosted project: pass --remote to seed it.`);

const admin = createClient(url, serviceRoleKey, {
	auth: { persistSession: false, autoRefreshToken: false },
});

/** [id, title, poster, release date, genre ids] */
const MOVIES = [
	[
		550,
		'Fight Club',
		'/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
		'1999-10-15',
		[18, 53],
	],
	[
		603,
		'Matrix',
		'/pEoqbqtLc4CcwDUDqxmEDSWpWTZ.jpg',
		'1999-03-31',
		[28, 878],
	],
	[
		155,
		'The Dark Knight : Le Chevalier noir',
		'/pyNXnq8QBWoK3b37RS6C3axwUOy.jpg',
		'2008-07-16',
		[28, 80, 53],
	],
	[
		27205,
		'Inception',
		'/aej3LRUga5rhgkmRP6XMFw3ejbl.jpg',
		'2010-07-15',
		[28, 878, 12],
	],
	[
		157336,
		'Interstellar',
		'/1pnigkWWy8W032o9TKDneBa3eVK.jpg',
		'2014-11-05',
		[12, 18, 878],
	],
	[
		680,
		'Pulp Fiction',
		'/4TBdF7nFw2aKNM0gPOlDNq3v3se.jpg',
		'1994-09-10',
		[53, 80, 35],
	],
	[
		13,
		'Forrest Gump',
		'/zi6RNYK1vXjIvpSBgjatXRcFYh2.jpg',
		'1994-06-23',
		[35, 18, 10749],
	],
	[
		278,
		'Les Évadés',
		'/t30GjttOdb5At1sYy8b3TOwFgWV.jpg',
		'1994-09-23',
		[18, 80],
	],
	[
		238,
		'Le Parrain',
		'/k3uIbYtiuK8pwbCcbma29nTqmgG.jpg',
		'1972-03-14',
		[18, 80],
	],
	[
		424,
		'La Liste de Schindler',
		'/fLRbv1fGQD0OCPWkFy7PI2sESLj.jpg',
		'1993-12-15',
		[18, 36, 10752],
	],
	[
		120,
		"Le Seigneur des anneaux : La Communauté de l'anneau",
		'/5OPg6M0yHr21Ovs1fni2H1xpKuF.jpg',
		'2001-12-18',
		[12, 14, 28],
	],
	[
		121,
		'Le Seigneur des anneaux : Les Deux Tours',
		'/qVHBqQYLDRs7ESjP9q6o9iPHLWj.jpg',
		'2002-12-18',
		[12, 14, 28],
	],
	[
		122,
		'Le Seigneur des anneaux : Le Retour du roi',
		'/ypUCFOvOf07bcHy81jng9LyMUfi.jpg',
		'2003-12-17',
		[12, 14, 28],
	],
	[
		11,
		'La Guerre des étoiles',
		'/qelTNHrBSYjPvwdzsDBPVsqnNzc.jpg',
		'1977-05-25',
		[12, 28, 878],
	],
	[
		1891,
		"L'Empire contre-attaque",
		'/qDvctAykmNWAmi9G2GrVrwWx3pr.jpg',
		'1980-05-20',
		[12, 28, 878],
	],
	[
		105,
		'Retour vers le futur',
		'/iCgFtDUZxN8iUzNBCisjUrBmg2q.jpg',
		'1985-07-03',
		[12, 35, 878],
	],
	[
		597,
		'Titanic',
		'/vpsvHLkoeKUjceIMeNSqCp3xEyY.jpg',
		'1997-12-18',
		[18, 10749],
	],
	[
		19995,
		'Avatar',
		'/7N8L80OaG8EBTDdRBjGqT8PBzCM.jpg',
		'2009-12-16',
		[28, 878, 12],
	],
	[
		299534,
		'Avengers : Endgame',
		'/wF7jv3x51hXgkl7t5KHePuRjXc8.jpg',
		'2019-04-24',
		[12, 878, 28],
	],
	[
		24428,
		'Avengers',
		'/ylsAO88v2tF0iXRFojPa0UaAJf1.jpg',
		'2012-04-25',
		[878, 28, 12],
	],
	[
		862,
		'Toy Story',
		'/4cWLRhub0yY9VJpdw0nqoTPYyiN.jpg',
		'1995-11-22',
		[10751, 35, 16, 12],
	],
	[
		807,
		'Seven',
		'/to6jUaLJonMuKW2YovtWfQKtLYP.jpg',
		'1995-09-22',
		[80, 9648, 53],
	],
	[
		274,
		'Le Silence des agneaux',
		'/sSQDxwm4r28YpJSQVyVOtpYVs0E.jpg',
		'1991-02-14',
		[80, 53, 18],
	],
	[
		769,
		'Les Affranchis',
		'/v4c6WMVqUlSJHMyjHNj72iTFGhm.jpg',
		'1990-09-12',
		[18, 80],
	],
	[
		578,
		'Les Dents de la mer',
		'/wuRf6gkX0JUJsu1MeECPubhMRdd.jpg',
		'1975-06-20',
		[27, 53, 12],
	],
	[
		329,
		'Jurassic Park',
		'/i268GVIlp777W1Ykws5R3LYYLIw.jpg',
		'1993-06-11',
		[12, 878],
	],
	[
		85,
		"Les Aventuriers de l'arche perdue",
		'/by5xmwAUVzXc3WyIyjMYCVaL5Lj.jpg',
		'1981-06-12',
		[12, 28],
	],
	[
		348,
		'Alien, le huitième passager',
		'/l8CES84JndFlNfBNMxdLRYaLvI6.jpg',
		'1979-05-25',
		[27, 878],
	],
	[
		78,
		'Blade Runner',
		'/zHKWxyG4j404HVeSYHNH4niUpkW.jpg',
		'1982-06-25',
		[878, 18, 53],
	],
	[
		62,
		"2001 : L'Odyssée de l'espace",
		'/uwd79G32FPIL5B9UkRgSZvS0gbe.jpg',
		'1968-04-02',
		[878, 9648, 12],
	],
	[
		438631,
		'Dune',
		'/qpyaW4xUPeIiYA5ckg5zAZFHvsb.jpg',
		'2021-09-15',
		[878, 12],
	],
	[
		693134,
		'Dune : Deuxième partie',
		'/iRNbRAIGQQr5diGnjpwJFm0dgt4.jpg',
		'2024-02-27',
		[878, 12],
	],
	[
		872585,
		'Oppenheimer',
		'/boAUuJBeID7VNp4L7LNMQs8mfQS.jpg',
		'2023-07-19',
		[18, 36],
	],
	[
		346698,
		'Barbie',
		'/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
		'2023-07-19',
		[35, 12, 14],
	],
	[
		324857,
		'Spider-Man : New Generation',
		'/7uPGS5CgvIjDcFUhw9HB9qYeDXf.jpg',
		'2018-12-06',
		[16, 28, 12, 878],
	],
	[
		475557,
		'Joker',
		'/tWjJ3ILjsbTwKgXxEv48QAbYZ19.jpg',
		'2019-10-01',
		[80, 53, 18],
	],
	[
		545611,
		'Everything Everywhere All at Once',
		'/qHy7BlA1I3iUEIGp7atsMjSNJSK.jpg',
		'2022-03-24',
		[28, 12, 878],
	],
	[
		76341,
		'Mad Max : Fury Road',
		'/oLy2V6AWSEfdPgKOtrSGnwB3Q2R.jpg',
		'2015-05-13',
		[28, 12, 878],
	],
	[
		244786,
		'Whiplash',
		'/3XriEpTdnplQRzyphAC0cu3emns.jpg',
		'2014-10-10',
		[18, 10402, 53],
	],
	[
		313369,
		'La La Land',
		'/5KIj6aioW1UtUT1IV0qqW5iZbNH.jpg',
		'2016-12-01',
		[35, 18, 10749],
	],
	[
		1124,
		'Le Prestige',
		'/37Fr7lY4QBHsuxlLJIfTNxW6nGW.jpg',
		'2006-10-19',
		[18, 9648, 878],
	],
	[
		77,
		'Memento',
		'/nK3cJaUWx1iaQ9Cs08JPtZqVzQ6.jpg',
		'2000-10-11',
		[9648, 53],
	],
	[
		49026,
		'The Dark Knight Rises',
		'/ApcGBERN0p9I0nDOIwJeEmpnLU5.jpg',
		'2012-07-17',
		[28, 80, 18, 53],
	],
	[
		272,
		'Batman Begins',
		'/taKcn26BMWnsUcMFSlr5RfGDtFB.jpg',
		'2005-06-10',
		[18, 80, 28],
	],
	[
		557,
		'Spider-Man',
		'/pNz1NREgddPdlzytlR8mW4B26fW.jpg',
		'2002-05-01',
		[28, 878],
	],
	[
		637,
		'La vie est belle',
		'/c6NveyskoKlwAvouqEmKBRU0Pkp.jpg',
		'1997-12-20',
		[35, 18],
	],
	[
		8587,
		'Le Roi lion',
		'/n6UChiAOSTHGih2FBactLjA4Cdt.jpg',
		'1994-06-15',
		[16, 10751, 18],
	],
	[
		12,
		'Le Monde de Nemo',
		'/8zR2vXoXfdlknEYjfHvCbb1rJbI.jpg',
		'2003-05-30',
		[16, 10751, 12],
	],
	[
		14160,
		'Là-haut',
		'/k55kMEPkxGej70udPcVNqhTiwBz.jpg',
		'2009-05-28',
		[16, 35, 10751, 12],
	],
	[
		10681,
		'WALL·E',
		'/4ImYwxnu4bOitzS9TDLnantF8mn.jpg',
		'2008-06-26',
		[16, 10751, 878],
	],
	[
		335984,
		'Blade Runner 2049',
		'/qWD9E0Wgn8w6nMMutCNFAUiSHrX.jpg',
		'2017-10-04',
		[878, 18],
	],
	[
		264660,
		'Ex Machina',
		'/gXUnFIZdLsGnZp2AxKjQIVm5jEM.jpg',
		'2015-01-21',
		[18, 878],
	],
	[
		419430,
		'Get Out',
		'/8WzjAhgc4HvpN3Y6LLCc6AbpIhF.jpg',
		'2017-02-24',
		[9648, 53, 27],
	],
];

/** Movies still to watch; every other one is watched. */
const MOVIES_TO_WATCH = new Set([
	693134, 872585, 346698, 545611, 313369, 335984, 264660, 419430, 12, 14160,
	10681, 637,
]);

/** [id, title, poster, first air date, genre ids, episodes per season (specials excluded)] */
const SHOWS = [
	[
		1399,
		'Game of Thrones',
		'/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
		'2011-04-17',
		[10765, 18, 10759],
		[10, 10, 10, 10, 10, 10, 7, 6],
	],
	[
		1396,
		'Breaking Bad',
		'/hVVxgGZFR3JaXmkstnG1IR9Qbt6.jpg',
		'2008-01-20',
		[18, 80],
		[7, 13, 13, 13, 16],
	],
	[
		66732,
		'Stranger Things',
		'/iGZkjG3BDTuWsWu9Cdmh2jh3q7d.jpg',
		'2016-07-15',
		[10759, 9648, 10765],
		[8, 9, 8, 9, 8],
	],
	[
		100088,
		'The Last of Us',
		'/4pMd9VAdqm96KA2W4X8yetgc7EF.jpg',
		'2023-01-15',
		[18],
		[9, 7],
	],
	[
		87108,
		'Chernobyl',
		'/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
		'2019-05-06',
		[18],
		[5],
	],
	[
		1100,
		'How I Met Your Mother',
		'/e6PuvBDHqUrJ3dRI2co1G4WXVWf.jpg',
		'2005-09-19',
		[35],
		[22, 22, 20, 24, 24, 24, 24, 24, 24],
	],
	[
		1668,
		'Friends',
		'/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg',
		'1994-09-22',
		[35],
		null,
	],
	[
		1418,
		'The Big Bang Theory',
		'/kMhMKG3IVJV8HhMGK7GEY6X73bP.jpg',
		'2007-09-24',
		[35],
		null,
	],
	[
		2316,
		'The Office',
		'/2dApsoX4bd98szjrbj5i3syYOh2.jpg',
		'2005-03-24',
		[35],
		null,
	],
	[
		60625,
		'Rick et Morty',
		'/s11re4xQLZ6pRPv2sqXnK8CCvGn.jpg',
		'2013-12-02',
		[16, 35, 10765, 10759],
		null,
	],
	[
		70523,
		'Dark',
		'/vbG0zu0lIVDZZaUVOZuBIE9kno3.jpg',
		'2017-12-01',
		[80, 18, 10765, 9648],
		null,
	],
	[
		71912,
		'The Witcher',
		'/rhErSlk0M236rNFertVAZa9lz9S.jpg',
		'2019-12-20',
		[18, 10759],
		null,
	],
	[
		76479,
		'The Boys',
		'/4Tw8TB9ikrcgzJgR0LOvgfnXD74.jpg',
		'2019-07-25',
		[10765, 10759],
		null,
	],
	[
		82856,
		'The Mandalorian',
		'/s8lHYTNYM919rDFvMs33tOeMbYf.jpg',
		'2019-11-12',
		[10765, 10759],
		null,
	],
	[
		84958,
		'Loki',
		'/zNwEwSXojMrQapZHQx5fO8iph4R.jpg',
		'2021-06-09',
		[18, 10765],
		null,
	],
	[
		93405,
		'Squid Game',
		'/heV89pC6pv5fz1plikfyQxYuE4L.jpg',
		'2021-09-17',
		[10759, 9648, 18],
		null,
	],
	[
		94605,
		'Arcane',
		'/ypS7R36Vjcn51zZsXsta5onnaCo.jpg',
		'2021-11-06',
		[16, 10759, 10765],
		null,
	],
	[
		136315,
		'The Bear',
		'/iaJfffjCqXATU5msr4PAgOWLMl4.jpg',
		'2022-06-23',
		[18, 35],
		null,
	],
];

/**
 * How far into each show the test account is: [seasons fully watched, episodes of the next].
 * Most recent first, so the "continue watching" row has a stable order.
 */
const PROGRESS = [
	[1396, 1, 4],
	[66732, 0, 3],
	[100088, 1, 2],
	[87108, 1, 0],
	[1399, 8, 0],
	[1100, 1, 0],
];
const ABANDONED = new Set([1100]);

/** TMDB provider ids: Netflix, Amazon Prime Video, Disney Plus. */
const STREAMING_PROVIDERS = [8, 119, 337];

const PEOPLE = {
	test: {
		email,
		password,
		username: 'e2e_test',
		fullName: 'E2E Test',
	},
	friend: {
		email: `friend.${email}`,
		password,
		username: 'e2e_friend',
		fullName: 'E2E Friend',
	},
	requester: {
		email: `requester.${email}`,
		password,
		username: 'e2e_requester',
		fullName: 'E2E Requester',
	},
};

const USER_TABLES = [
	'watchlist',
	'episode_watches',
	'reviews',
	'playlists',
	'user_streaming_providers',
	'user_prompts',
	'recommendation_dismissals',
	'notifications',
	'push_subscriptions',
	'mcp_keys',
	'privacy_settings',
	'notification_preferences',
];

function check(label, { error }) {
	if (error) fail(`${label}: ${error.message}`);
}

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS).toISOString();

async function findUserByEmail(target) {
	for (let page = 1; ; page++) {
		const { data, error } = await admin.auth.admin.listUsers({
			page,
			perPage: 200,
		});
		if (error) fail(`listUsers: ${error.message}`);
		const user = data.users.find((u) => u.email === target);
		if (user) return user;
		if (data.users.length < 200) return null;
	}
}

/** Creates the account, or resets its password and metadata when it already exists. */
async function ensureUser({
	email: target,
	password: secret,
	username,
	fullName,
}) {
	const metadata = {
		username,
		full_name: fullName,
		region: 'BE',
		language: 'en',
	};
	const existing = await findUserByEmail(target);
	let user = existing;
	if (existing) {
		const { data, error } = await admin.auth.admin.updateUserById(
			existing.id,
			{
				password: secret,
				email_confirm: true,
				user_metadata: metadata,
			}
		);
		if (error) fail(`updateUser ${target}: ${error.message}`);
		user = data.user;
	} else {
		const { data, error } = await admin.auth.admin.createUser({
			email: target,
			password: secret,
			email_confirm: true,
			user_metadata: metadata,
		});
		if (error) fail(`createUser ${target}: ${error.message}`);
		user = data.user;
	}

	check(
		`profile ${username}`,
		await admin.from('user_profiles').upsert(
			{
				user_id: user.id,
				username,
				full_name: fullName,
				onboarding_completed: true,
			},
			{ onConflict: 'user_id' }
		)
	);
	return user.id;
}

async function wipe(userIds) {
	for (const table of USER_TABLES)
		check(
			`wipe ${table}`,
			await admin.from(table).delete().in('user_id', userIds)
		);
	check(
		'wipe friendships',
		await admin
			.from('friendships')
			.delete()
			.or(
				userIds
					.map((id) => `requester_id.eq.${id},addressee_id.eq.${id}`)
					.join(',')
			)
	);
}

function episodeRows(userId) {
	const rows = [];
	let clock = 0;
	for (const [tvId, fullSeasons, nextEpisodes] of PROGRESS) {
		const seasons = SHOWS.find(([id]) => id === tvId)[5];
		const watched = seasons.flatMap((count, index) => {
			const seasonNumber = index + 1;
			const upTo =
				index < fullSeasons
					? count
					: index === fullSeasons
						? nextEpisodes
						: 0;
			return Array.from({ length: upTo }, (_, e) => [
				seasonNumber,
				e + 1,
			]);
		});
		// Oldest episode first; each show's last episode older than the previous show's first.
		clock += watched.length + 1;
		watched.forEach(([seasonNumber, episodeNumber], index) =>
			rows.push({
				user_id: userId,
				tv_id: tvId,
				season_number: seasonNumber,
				episode_number: episodeNumber,
				watched_at: new Date(
					Date.now() - (clock - index) * 3_600_000
				).toISOString(),
			})
		);
	}
	return rows;
}

function watchlistRows(userId) {
	const watchedCounts = new Map();
	for (const row of episodeRows(userId))
		watchedCounts.set(row.tv_id, (watchedCounts.get(row.tv_id) ?? 0) + 1);

	const movies = MOVIES.map(
		([id, title, poster, releaseDate, genreIds], index) => ({
			user_id: userId,
			media_id: id,
			media_type: 'movie',
			media_title: title,
			poster_path: poster,
			release_date: releaseDate,
			genre_ids: genreIds,
			status: MOVIES_TO_WATCH.has(id) ? 'to_watch' : 'watched',
			created_at: daysAgo(3 + index * 4),
		})
	);

	const shows = SHOWS.map(
		([id, title, poster, releaseDate, genreIds, seasons], index) => {
			const total = seasons
				? seasons.reduce((sum, n) => sum + n, 0)
				: null;
			const watched = watchedCounts.get(id) ?? 0;
			const status = ABANDONED.has(id)
				? 'abandoned'
				: total !== null && watched >= total
					? 'watched'
					: 'to_watch';
			return {
				user_id: userId,
				media_id: id,
				media_type: 'tv',
				media_title: title,
				poster_path: poster,
				release_date: releaseDate,
				genre_ids: genreIds,
				total_episodes: total,
				status,
				created_at: daysAgo(1 + index * 9),
			};
		}
	);

	return [...movies, ...shows];
}

async function seed() {
	const testId = await ensureUser(PEOPLE.test);
	const friendId = await ensureUser(PEOPLE.friend);
	const requesterId = await ensureUser(PEOPLE.requester);
	await wipe([testId, friendId, requesterId]);

	const library = watchlistRows(testId);
	check('watchlist', await admin.from('watchlist').insert(library));
	const episodes = episodeRows(testId);
	check(
		'episode_watches',
		await admin.from('episode_watches').insert(episodes)
	);

	check(
		'reviews',
		await admin.from('reviews').insert([
			{
				user_id: testId,
				media_id: 603,
				media_type: 'movie',
				media_title: 'Matrix',
				poster_path: '/pEoqbqtLc4CcwDUDqxmEDSWpWTZ.jpg',
				rating: 9,
				content: 'Still the reference for action sci-fi.',
			},
			{
				user_id: testId,
				media_id: 155,
				media_type: 'movie',
				media_title: 'The Dark Knight : Le Chevalier noir',
				poster_path: '/pyNXnq8QBWoK3b37RS6C3axwUOy.jpg',
				rating: 10,
				content: null,
			},
			{
				user_id: testId,
				media_id: 1396,
				media_type: 'tv',
				media_title: 'Breaking Bad',
				poster_path: '/hVVxgGZFR3JaXmkstnG1IR9Qbt6.jpg',
				rating: 10,
				content: null,
			},
			{
				user_id: friendId,
				media_id: 550,
				media_type: 'movie',
				media_title: 'Fight Club',
				poster_path: '/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
				rating: 8,
				content: 'The first rule is to watch it twice.',
			},
			{
				user_id: friendId,
				media_id: 603,
				media_type: 'movie',
				media_title: 'Matrix',
				poster_path: '/pEoqbqtLc4CcwDUDqxmEDSWpWTZ.jpg',
				rating: 8,
				content: null,
			},
		])
	);

	check(
		'friend watchlist',
		await admin.from('watchlist').insert(
			MOVIES.slice(0, 8).map(
				([id, title, poster, releaseDate, genreIds], index) => ({
					user_id: friendId,
					media_id: id,
					media_type: 'movie',
					media_title: title,
					poster_path: poster,
					release_date: releaseDate,
					genre_ids: genreIds,
					status: index % 2 ? 'to_watch' : 'watched',
				})
			)
		)
	);

	check(
		'friendships',
		await admin.from('friendships').insert([
			{
				requester_id: testId,
				addressee_id: friendId,
				status: 'accepted',
			},
			{
				requester_id: requesterId,
				addressee_id: testId,
				status: 'pending',
			},
		])
	);

	check(
		'streaming providers',
		await admin
			.from('user_streaming_providers')
			.insert({ user_id: testId, provider_ids: STREAMING_PROVIDERS })
	);

	const { data: playlist, error: playlistError } = await admin
		.from('playlists')
		.insert({
			user_id: testId,
			name: 'Nolan',
			description: 'Every Christopher Nolan in the library.',
			visibility: 'public',
		})
		.select('id')
		.single();
	if (playlistError) fail(`playlist: ${playlistError.message}`);
	check(
		'playlist items',
		await admin.from('playlist_items').insert(
			MOVIES.filter(([id]) =>
				[155, 27205, 157336, 1124, 77, 49026, 272].includes(id)
			).map(([id, title, poster, releaseDate, genreIds]) => ({
				playlist_id: playlist.id,
				media_id: id,
				media_type: 'movie',
				media_title: title,
				poster_path: poster,
				release_date: releaseDate,
				genre_ids: genreIds,
			}))
		)
	);

	const count = (status, type) =>
		library.filter((e) => e.status === status && e.media_type === type)
			.length;
	console.log(
		[
			`seed:test — ${host}`,
			`  ${email}: ${count('watched', 'movie')} movies watched, ${count('to_watch', 'movie')} to watch; ${count('watched', 'tv')} shows watched, ${count('to_watch', 'tv')} in progress or to watch, ${count('abandoned', 'tv')} abandoned; ${episodes.length} episodes`,
			`  friend: ${PEOPLE.friend.email} (accepted) · pending request from ${PEOPLE.requester.email}`,
		].join('\n')
	);
}

await seed();
