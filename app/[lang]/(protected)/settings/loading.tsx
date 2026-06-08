import { Skeleton } from '@/components/ui/skeleton';
import { SettingsContentSkeleton } from '@/components/settings/SettingsContentSkeleton';

export default function SettingsLoading() {
	return (
		<div className="container mx-auto py-12 md:py-16 lg:py-20 px-6 lg:px-12">
			<div className="mb-12 md:mb-16">
				<Skeleton className="h-10 w-32 mb-3" />
				<Skeleton className="h-5 w-48" />
			</div>
			<SettingsContentSkeleton />
		</div>
	);
}
