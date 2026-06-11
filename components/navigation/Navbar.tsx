import { getUserContext } from '@/lib/supabase/auth-helpers';
import { getTranslations } from '@/lib/i18n/server';
import { NavbarClient } from '@/components/navigation/NavbarClient';

export default async function Navbar() {
	const { supabase, user } = await getUserContext();
	const t = await getTranslations();

	let initialUnreadCount = 0;
	let avatarUrl: string | null = null;
	if (user) {
		const [{ count }, { data: profile }] = await Promise.all([
			supabase
				.from('notifications')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', user.id)
				.is('read_at', null),
			supabase
				.from('user_profiles')
				.select('avatar_url')
				.eq('user_id', user.id)
				.maybeSingle(),
		]);
		initialUnreadCount = count ?? 0;
		avatarUrl = profile?.avatar_url ?? null;
	}

	return (
		<NavbarClient
			user={user}
			t={t}
			initialUnreadCount={initialUnreadCount}
			avatarUrl={avatarUrl}
		/>
	);
}
