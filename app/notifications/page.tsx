import { requireAuth } from '@/lib/auth';
import { getTranslations } from '@/lib/i18n/server';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getNotifications } from '@/app/actions/notifications';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { BASE_URL, buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
	const t = await getTranslations();
	return buildPageMetadata(t.notifications.title, t.notifications.title, {
		isPrivate: true,
		canonical: `${BASE_URL}/notifications`,
	});
}

export default async function NotificationsPage() {
	await requireAuth();
	const t = await getTranslations();
	const notifications = await getNotifications(50);

	return (
		<PageLayout className="screen-in">
			<PageHeader title={t.notifications.title} />
			<NotificationsList initial={notifications} />
		</PageLayout>
	);
}
