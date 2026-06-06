import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import { NavbarClient } from '@/components/navigation/NavbarClient';

export default async function Navbar() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const t = await getTranslations();

	let initialUnreadCount = 0;
	if (user) {
		const { count } = await supabase
			.from('notifications')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.is('read_at', null);
		initialUnreadCount = count ?? 0;
	}

	return (
		<NavbarClient
			user={user}
			t={t}
			initialUnreadCount={initialUnreadCount}
		/>
	);
}
