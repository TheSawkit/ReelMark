import { Skeleton } from '@/components/ui/skeleton';

/** Films/Series switcher placeholder: same 54px pill and bottom margin as MediaTypeSwitcher. */
export function MediaTypeSwitcherSkeleton() {
	return (
		<div className="flex justify-center mb-8">
			<Skeleton className="h-13.5 w-57 rounded-xl" />
		</div>
	);
}
