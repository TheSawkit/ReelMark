import { Skeleton } from '@/components/ui/skeleton';

export default function LoginLoading() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="flex flex-col items-center gap-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-48" />
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-full" />
				</div>

				<div className="flex items-center gap-2">
					<Skeleton className="h-px flex-1" />
					<Skeleton className="h-4 w-8" />
					<Skeleton className="h-px flex-1" />
				</div>

				<Skeleton className="h-10 w-full" />

				<Skeleton className="h-4 w-48 mx-auto" />
			</div>
		</div>
	);
}
