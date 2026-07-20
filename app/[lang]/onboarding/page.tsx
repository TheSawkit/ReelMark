import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import {
	ensureUniqueUsername,
	needsOnboarding,
	suggestUsernameFromMetadata,
} from '@/lib/onboarding';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import type { Language } from '@/lib/i18n/translations';

type Props = {
	params: Promise<{ lang: Language }>;
};

export async function generateMetadata({ params }: Props) {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return {
		title: t.onboarding.title,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
	};
}

export default async function OnboardingPage({ params }: Props) {
	const { lang } = await params;
	const user = await requireAuth();
	const supabase = await createClient();

	const { data: profile } = await supabase
		.from('user_profiles')
		.select('username, onboarding_completed')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!needsOnboarding(user.user_metadata, profile?.onboarding_completed)) {
		redirect(localizedHref(lang, '/dashboard'));
	}

	const existingUsername =
		(typeof user.user_metadata?.username === 'string' &&
			user.user_metadata.username) ||
		profile?.username ||
		null;

	const initialUsername = existingUsername
		? existingUsername
		: await ensureUniqueUsername(
				supabase,
				suggestUsernameFromMetadata(user.user_metadata, user.email)
			);

	return <OnboardingForm initialUsername={initialUsername} />;
}
