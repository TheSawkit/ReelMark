import { common } from './messages/common';
import { pwa } from './messages/pwa';
import { navbar } from './messages/navbar';
import { notifications } from './messages/notifications';
import { hero } from './messages/hero';
import { features } from './messages/features';
import { explorer } from './messages/explorer';
import { library } from './messages/library';
import { lists } from './messages/lists';
import { settings } from './messages/settings';
import { profile } from './messages/profile';
import { auth } from './messages/auth';
import { movie } from './messages/movie';
import { pages } from './messages/pages';
import { home } from './messages/home';
import { offline } from './messages/offline';
import { danger } from './messages/danger';
import { metadata } from './messages/metadata';
import { onboarding } from './messages/onboarding';
import { oauth } from './messages/oauth';
import { support } from './messages/support';

export const translations = {
	fr: {
		common: common.fr,
		pwa: pwa.fr,
		navbar: navbar.fr,
		notifications: notifications.fr,
		hero: hero.fr,
		features: features.fr,
		explorer: explorer.fr,
		library: library.fr,
		lists: lists.fr,
		settings: settings.fr,
		profile: profile.fr,
		auth: auth.fr,
		movie: movie.fr,
		pages: pages.fr,
		home: home.fr,
		offline: offline.fr,
		danger: danger.fr,
		metadata: metadata.fr,
		onboarding: onboarding.fr,
		oauth: oauth.fr,
		support: support.fr,
	},
	en: {
		common: common.en,
		pwa: pwa.en,
		navbar: navbar.en,
		notifications: notifications.en,
		hero: hero.en,
		features: features.en,
		explorer: explorer.en,
		library: library.en,
		lists: lists.en,
		settings: settings.en,
		profile: profile.en,
		auth: auth.en,
		movie: movie.en,
		pages: pages.en,
		home: home.en,
		offline: offline.en,
		danger: danger.en,
		metadata: metadata.en,
		onboarding: onboarding.en,
		oauth: oauth.en,
		support: support.en,
	},
};

export type Language = keyof typeof translations;
export type Translations = (typeof translations)['fr'];
