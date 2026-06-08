import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton';

export default function SearchLoading() {
	return (
		<div className="container mx-auto py-12 px-6">
			<div className="mb-10 space-y-3">
				<div className="h-9 w-72 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-4 w-48 rounded bg-surface-2 animate-pulse" />
			</div>

			<div className="h-10 w-full max-w-xl rounded-lg bg-surface-2 animate-pulse mb-8" />

			<div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
				{Array.from({ length: 14 }).map((_, i) => (
					<MediaCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
