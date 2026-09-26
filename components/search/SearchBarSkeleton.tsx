import { Skeleton } from '@/components/ui/skeleton';

/** Full-size SearchBar placeholder (non-compact): same height, width cap and margins. */
export function SearchBarSkeleton() {
	return (
		<Skeleton className="h-16 w-full max-w-3xl mx-auto mb-8 md:mb-12 rounded-(--radius-xl)" />
	);
}
