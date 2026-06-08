import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';

export default function CategoryLoading() {
	return (
		<div className="container mx-auto py-12 px-6">
			<div className="mb-10 space-y-3">
				<div className="h-9 w-48 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-4 w-64 rounded bg-surface-2 animate-pulse" />
			</div>

			<div className="h-10 w-full max-w-xl rounded-lg bg-surface-2 animate-pulse mb-8" />

			<div className="flex flex-wrap gap-2 mb-10">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="h-10 w-28 rounded-full bg-surface-2 animate-pulse"
					/>
				))}
			</div>

			<MediaSectionsSkeleton sections={1} cardsPerSection={20} />
		</div>
	);
}
