import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { needsOnboarding } from '@/lib/onboarding';

/**
 * Auth boundary for every route in the (protected) group — redirects to /login when
 * unauthenticated, or to /onboarding while the profile (username + region) is incomplete.
 */
export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await requireAuth();
	const supabase = await createClient();

	const { data: profile } = await supabase
		.from('user_profiles')
		.select('onboarding_completed')
		.eq('user_id', user.id)
		.maybeSingle();

	if (needsOnboarding(user.user_metadata, profile?.onboarding_completed)) {
		redirect(localizedHref(await getServerLanguage(), '/onboarding'));
	}

	return <>{children}</>;
}
