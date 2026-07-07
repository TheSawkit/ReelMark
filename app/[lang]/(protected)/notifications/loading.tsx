import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { NotificationsSkeleton } from '@/components/notifications/NotificationsSkeleton';
import { getTranslations } from '@/lib/i18n/server';

export default async function NotificationsLoading() {
	const t = await getTranslations();
	return (
		<PageLayout>
			<PageHeader title={t.notifications.title} />
			<NotificationsSkeleton />
		</PageLayout>
	);
}
