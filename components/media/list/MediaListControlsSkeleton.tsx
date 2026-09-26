import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Sort / direction / genres / actor-search row, sized like MediaListControls so it wraps at the same widths. */
export function MediaListControlsSkeleton({
	className,
}: {
	className?: string;
}) {
	return (
		<div className={cn('flex flex-wrap items-center gap-2', className)}>
			<Skeleton className="h-11 w-47 rounded-full" />
			<Skeleton className="h-11 w-10.5 rounded-full" />
			<Skeleton className="h-11 w-25 rounded-full" />
			<Skeleton className="h-11 flex-1 min-w-44 max-w-64 rounded-lg" />
		</div>
	);
}
