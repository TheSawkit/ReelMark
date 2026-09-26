import { PageLayout, PageHeaderSkeleton } from '@/components/layout/PageLayout';
import { SettingsContentSkeleton } from '@/components/settings/SettingsContentSkeleton';

export default function SettingsLoading() {
	return (
		<PageLayout>
			<PageHeaderSkeleton />
			<SettingsContentSkeleton />
		</PageLayout>
	);
}
