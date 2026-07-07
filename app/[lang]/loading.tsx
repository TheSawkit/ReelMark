import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
	return (
		<div className="min-h-screen">
			<section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
				<div className="max-w-4xl mx-auto space-y-6">
					<Skeleton className="h-5 w-24 rounded-full mx-auto" />
					<div className="space-y-3">
						<Skeleton className="h-16 w-full max-w-2xl rounded-xl mx-auto" />
						<Skeleton className="h-16 w-3/4 max-w-xl rounded-xl mx-auto" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-5 w-full max-w-lg rounded mx-auto" />
						<Skeleton className="h-5 w-2/3 max-w-sm rounded mx-auto" />
					</div>
					<div className="flex gap-4 justify-center pt-2">
						<Skeleton className="h-11 w-36 rounded-lg" />
						<Skeleton className="h-11 w-36 rounded-lg" />
					</div>
				</div>
			</section>
		</div>
	);
}
