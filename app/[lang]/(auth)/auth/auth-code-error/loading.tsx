import { Skeleton } from '@/components/ui/skeleton';

export default function AuthErrorLoading() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center gap-6">
			<Skeleton className="h-12 w-72 md:w-96" />
			<div className="space-y-2">
				<Skeleton className="h-5 w-80 max-w-md mx-auto" />
				<Skeleton className="h-5 w-64 max-w-md mx-auto" />
			</div>
			<div className="flex gap-4 mt-2">
				<Skeleton className="h-10 w-28" />
				<Skeleton className="h-10 w-28" />
			</div>
		</div>
	);
}
