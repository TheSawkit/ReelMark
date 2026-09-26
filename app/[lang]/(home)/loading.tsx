import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
	return (
		<div data-skeleton="home" className="min-h-screen">
			<section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 py-24 lg:px-12">
				<div className="relative z-10 mx-auto w-full max-w-4xl text-center">
					<Skeleton className="mx-auto mb-6 h-15.75 w-3/4 rounded-xl sm:h-19 md:h-25.25 lg:h-33.75" />

					<div className="mx-auto mb-3 max-w-2xl">
						<div className="flex h-7 items-center justify-center md:h-8">
							<Skeleton className="h-5 w-full rounded" />
						</div>
						<div className="flex h-7 items-center justify-center sm:hidden">
							<Skeleton className="h-5 w-1/2 rounded" />
						</div>
					</div>

					<div className="mx-auto mb-12 max-w-2xl">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className={
									i === 2
										? 'flex h-8 items-center justify-center md:hidden'
										: 'flex h-8 items-center justify-center md:h-10'
								}
							>
								<Skeleton className="h-6 w-5/6 rounded md:h-8" />
							</div>
						))}
					</div>

					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Skeleton className="h-14.75 w-63 rounded-xl" />
						<Skeleton className="h-14 w-28 rounded-xl" />
					</div>
				</div>
			</section>
		</div>
	);
}
