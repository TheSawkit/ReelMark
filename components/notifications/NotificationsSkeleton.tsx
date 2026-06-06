import { Skeleton } from '@/components/ui/skeleton';

export function NotificationsSkeleton() {
	return (
		<div className="space-y-2">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="flex items-start gap-3 px-3 py-2.5">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="flex-1 space-y-2 py-1">
						<Skeleton className="h-3.5 w-3/4" />
						<Skeleton className="h-3 w-1/3" />
					</div>
				</div>
			))}
		</div>
	);
}
