import { Skeleton } from '@/components/ui/skeleton';

const PILL_WIDTHS = ['w-24', 'w-36', 'w-32', 'w-36', 'w-36', 'w-40'] as const;

export function CategoryNavSkeleton() {
	return (
		<div className="flex gap-3 overflow-hidden mb-8">
			{PILL_WIDTHS.map((width, i) => (
				<Skeleton
					key={i}
					className={`h-11 ${width} shrink-0 rounded-full`}
				/>
			))}
		</div>
	);
}
