import { PageLayout } from '@/components/layout/PageLayout';
import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton';
import { MEDIA_GRID } from '@/components/media/card/grid';
import { Skeleton } from '@/components/ui/skeleton';

/** Playlist page placeholder, shared by `loading.tsx` and the page's Suspense fallback. */
export function PlaylistPageSkeleton() {
	return (
		<>
			<Skeleton className="relative banner-pull-top banner-safe-pad min-h-[20vh] md:min-h-[50vh] flex flex-col justify-end rounded-none">
				<div className="container mx-auto px-6 lg:px-12 pt-8 pb-8 md:pb-14 flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-12">
					<div className="flex-1 flex flex-col items-center space-y-4 md:space-y-5 lg:items-start">
						<div className="h-8 w-32 rounded-full bg-surface-3" />
						<div className="h-12 sm:h-15 lg:h-18 bg-surface-3 rounded-lg w-80 max-w-full" />
						<div className="h-5 bg-surface-3 rounded w-64 max-w-full" />
						<div className="flex gap-3 pt-2 md:pt-1">
							<div className="h-8 w-28 rounded-md bg-surface-3" />
							<div className="h-8 w-20 rounded-md bg-surface-3" />
						</div>
					</div>
					<div className="flex max-lg:hidden items-end gap-0">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="w-24 aspect-2/3 rounded-poster bg-surface-3"
								style={{
									marginLeft: i > 0 ? '-1.5rem' : 0,
									zIndex: 5 - i,
								}}
							/>
						))}
					</div>
				</div>
			</Skeleton>
			<PageLayout className="pt-8 md:pt-12">
				<div className={MEDIA_GRID.className}>
					{Array.from({ length: 12 }).map((_, i) => (
						<MediaCardSkeleton key={i} />
					))}
				</div>
			</PageLayout>
		</>
	);
}
