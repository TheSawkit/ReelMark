import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
	getFullUser,
	isOAuthOnly,
	redirectToLogin,
} from '@/lib/supabase/auth-helpers';
import { SettingsContent } from '@/components/settings/SettingsContent';
import { SettingsContentSkeleton } from '@/components/settings/SettingsContentSkeleton';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations } from '@/lib/i18n/server';
import { USER_PROFILE_COLUMNS, PRIVACY_COLUMNS } from '@/lib/supabase/columns';
import { getAvailableProviders } from '@/lib/tmdb';
import { getUserRegion } from '@/lib/tmdb/client';
import { getMyStreamingProviders } from '@/lib/data/recommendations';
import { getNotificationPreferences } from '@/lib/data/notifications';
import { getMcpLinkStatus } from '@/lib/data/mcp';
import type { Language } from '@/lib/i18n/translations';
import type { UserProfile, PrivacySettings } from '@/types/profile';

type Props = {
	params: Promise<{ lang: Language }>;
};

export async function generateMetadata({ params }: Props) {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return {
		title: t.settings.title,
		description: t.settings.subtitle,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
	};
}

async function SettingsSection({ lang }: { lang: Language }) {
	// The one screen that needs the full Auth record (identities for the password/delete
	// flows, the freshest email) — every other page reads the verified token instead.
	const [user, supabase] = await Promise.all([getFullUser(), createClient()]);
	if (!user) return redirectToLogin();

	const [
		profileResult,
		privacyResult,
		region,
		selectedProviderIds,
		notificationPreferences,
		mcpLink,
	] = await Promise.all([
		supabase
			.from('user_profiles')
			.select(USER_PROFILE_COLUMNS)
			.eq('user_id', user.id)
			.maybeSingle(),
		supabase
			.from('privacy_settings')
			.select(PRIVACY_COLUMNS)
			.eq('user_id', user.id)
			.maybeSingle(),
		getUserRegion(lang),
		getMyStreamingProviders(),
		getNotificationPreferences(),
		getMcpLinkStatus(),
	]);

	const streamingProviders = await getAvailableProviders(region, lang);

	const userProfile = (profileResult.data as UserProfile | null) ?? null;
	const privacySettings =
		(privacyResult.data as PrivacySettings | null) ?? null;

	return (
		<SettingsContent
			user={user}
			userProfile={userProfile}
			privacySettings={privacySettings}
			isOAuthOnly={isOAuthOnly(user)}
			streamingProviders={streamingProviders}
			selectedProviderIds={selectedProviderIds}
			notificationPreferences={notificationPreferences}
			mcpLink={mcpLink}
		/>
	);
}

export default async function SettingsPage({ params }: Props) {
	const { lang } = await params;
	await requireAuth();
	const t = await getTranslations(lang);

	return (
		<PageLayout>
			<PageHeader
				title={t.settings.title}
				subtitle={t.settings.subtitle}
			/>
			<Suspense fallback={<SettingsContentSkeleton />}>
				<SettingsSection lang={lang} />
			</Suspense>
		</PageLayout>
	);
}
