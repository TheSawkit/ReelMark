import { PageLayout } from '@/components/layout/PageLayout';
import { ProfileHeroSkeleton } from '@/components/profile/ProfileHeroSkeleton';
import { ProfileTabsSkeleton } from '@/components/profile/ProfileTabsSkeleton';

export default function ProfileLoading() {
	return (
		<PageLayout>
			<ProfileHeroSkeleton />
			<ProfileTabsSkeleton />
		</PageLayout>
	);
}
