import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isOAuthOnly } from '@/lib/supabase/auth-helpers';
import { SettingsContent } from '@/components/settings/SettingsContent';
import {
	isSettingsTab,
	type SettingsTab,
} from '@/components/settings/SettingsNav';
import { SettingsContentSkeleton } from '@/components/settings/SettingsContentSkeleton';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations } from '@/lib/i18n/server';
import { USER_PROFILE_COLUMNS, PRIVACY_COLUMNS } from '@/lib/supabase/columns';
import { getAvailableProviders } from '@/lib/tmdb';
import { getUserRegion } from '@/lib/tmdb/client';
import { getMyStreamingProviders } from '@/app/actions/recommendations';
import type { Language } from '@/lib/i18n/translations';
import type { UserProfile, PrivacySettings } from '@/types/profile';
import type { User } from '@supabase/supabase-js';

type Props = {
	params: Promise<{ lang: Language }>;
	searchParams: Promise<{ section?: string }>;
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

async function SettingsSection({
	user,
	lang,
	initialTab,
}: {
	user: User;
	lang: Language;
	initialTab: SettingsTab;
}) {
	const supabase = await createClient();

	const [profileResult, privacyResult, region, selectedProviderIds] =
		await Promise.all([
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
			initialTab={initialTab}
		/>
	);
}

export default async function SettingsPage({ params, searchParams }: Props) {
	const [{ lang }, { section }] = await Promise.all([params, searchParams]);
	const user = await requireAuth();
	const t = await getTranslations(lang);

	return (
		<PageLayout>
			<PageHeader
				title={t.settings.title}
				subtitle={t.settings.subtitle}
			/>
			<Suspense fallback={<SettingsContentSkeleton />}>
				<SettingsSection
					user={user}
					lang={lang}
					initialTab={isSettingsTab(section) ? section : 'profile'}
				/>
			</Suspense>
		</PageLayout>
	);
}
