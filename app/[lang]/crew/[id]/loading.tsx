import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeadingSkeleton } from '@/components/ui/SectionHeading';
import { cn } from '@/lib/utils';
import { DetailBannerSkeleton } from '@/components/media/detail/MediaDetailSkeleton';

const BIO_LINES_MOBILE = 16;
const BIO_LINES_DESKTOP = 8;

export default function CrewLoading() {
	return (
		<div className="min-h-screen">
			<DetailBannerSkeleton variant="crew" />

			<div className="detail-container">
				<div className="space-y-4">
					<SectionHeadingSkeleton />
					<div className="max-w-prose">
						{Array.from({ length: BIO_LINES_MOBILE }).map((_, i) => (
							<div
								key={i}
								className={cn(
									'flex h-7.25 items-center',
									i >= BIO_LINES_DESKTOP && 'md:hidden'
								)}
							>
								<Skeleton className="h-4 w-full rounded" />
							</div>
						))}
					</div>
					<Skeleton className="h-10 w-28 rounded-md" />
				</div>

				<div className="space-y-6">
					<Skeleton className="h-8 w-48 rounded" />
					<div className="flex gap-2">
						<Skeleton className="h-10 w-28 rounded-lg" />
						<Skeleton className="h-10 w-28 rounded-lg" />
					</div>
					<PosterGridSkeleton />
				</div>
			</div>
		</div>
	);
}
