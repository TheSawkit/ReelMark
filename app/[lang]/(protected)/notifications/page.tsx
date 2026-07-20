import { getTranslations } from '@/lib/i18n/server';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getNotifications } from '@/app/actions/notifications';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { BASE_URL, buildPageMetadata } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

type Props = {
	params: Promise<{ lang: Language }>;
};

export async function generateMetadata({ params }: Props) {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return buildPageMetadata(t.notifications.title, t.notifications.title, {
		isPrivate: true,
		canonical: `${BASE_URL}/notifications`,
	});
}

export default async function NotificationsPage({ params }: Props) {
	const { lang } = await params;
	const t = await getTranslations(lang);
	const notifications = await getNotifications(50);

	return (
		<PageLayout className="screen-in">
			<PageHeader title={t.notifications.title} />
			<NotificationsList initial={notifications} />
		</PageLayout>
	);
}
