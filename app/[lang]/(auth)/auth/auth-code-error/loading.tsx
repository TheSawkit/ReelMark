import { Skeleton } from '@/components/ui/skeleton';

export default function AuthErrorLoading() {
	return (
		<div className="flex flex-col items-center text-center">
			<Skeleton className="mb-4 h-10 w-72 md:h-12 md:w-96" />
			<div className="mb-8 space-y-2">
				<Skeleton className="h-5 w-80 max-w-md" />
				<Skeleton className="mx-auto h-5 w-64 max-w-md" />
			</div>
			<div className="flex gap-4">
				<Skeleton className="h-10 w-28" />
				<Skeleton className="h-10 w-28" />
			</div>
		</div>
	);
}
