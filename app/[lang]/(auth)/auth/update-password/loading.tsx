import { Skeleton } from '@/components/ui/skeleton';

export default function UpdatePasswordLoading() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="flex flex-col items-center gap-2">
					<Skeleton className="h-8 w-44" />
					<Skeleton className="h-4 w-60" />
				</div>
				<div className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-4 w-48 mx-auto" />
			</div>
		</div>
	);
}
