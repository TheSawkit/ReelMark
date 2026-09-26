import { PageLayout, PageHeaderSkeleton } from '@/components/layout/PageLayout';
import { NotificationsSkeleton } from '@/components/notifications/NotificationsSkeleton';

export default function NotificationsLoading() {
	return (
		<PageLayout>
			<PageHeaderSkeleton subtitle={false} />
			<NotificationsSkeleton />
		</PageLayout>
	);
}
