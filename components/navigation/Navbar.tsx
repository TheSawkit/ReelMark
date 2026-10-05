import { getUserContext } from '@/lib/supabase/auth-helpers';
import { getShellState } from '@/lib/data/prompts';
import { getTranslations } from '@/lib/i18n/server';
import { NavbarClient } from '@/components/navigation/NavbarClient';
import type { Language } from '@/lib/i18n/translations';

export default async function Navbar({ lang }: { lang: Language }) {
	const [{ user }, t] = await Promise.all([
		getUserContext(),
		getTranslations(lang),
	]);

	// Shares one round-trip with the call-to-action slot rendered in the same layout.
	const shell = user ? await getShellState() : null;

	return (
		<NavbarClient
			user={user}
			t={t}
			initialUnreadCount={shell?.unreadCount ?? 0}
			avatarUrl={shell?.avatarUrl ?? null}
		/>
	);
}
