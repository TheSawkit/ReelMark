import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { NotificationsSkeleton } from '@/components/notifications/NotificationsSkeleton';

export default function NotificationsLoading() {
	return (
		<PageLayout>
			<PageHeader title="Notifications" />
			<NotificationsSkeleton />
		</PageLayout>
	);
}
