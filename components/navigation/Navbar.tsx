import { getUserContext } from '@/lib/supabase/auth-helpers';
import { getShellState } from '@/lib/data/prompts';
import { getTranslations } from '@/lib/i18n/server';
import { NavbarClient } from '@/components/navigation/NavbarClient';

export default async function Navbar() {
	const [{ user }, t] = await Promise.all([
		getUserContext(),
		getTranslations(),
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
