import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';

export default function DashboardLoading() {
	return (
		<div className="container mx-auto py-12 px-6">
			<div className="mb-10 space-y-3">
				<div className="h-9 w-64 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-4 w-96 rounded bg-surface-2 animate-pulse" />
			</div>

			<div className="mb-10 h-104 w-full rounded-3xl bg-surface-2 animate-pulse sm:h-112" />

			<div className="mb-10 grid grid-cols-3 gap-3 sm:gap-4">
				<div className="h-28 rounded-2xl bg-surface-2 animate-pulse" />
				<div className="h-28 rounded-2xl bg-surface-2 animate-pulse" />
				<div className="h-28 rounded-2xl bg-surface-2 animate-pulse" />
			</div>

			<div className="mb-12 flex gap-3.5 overflow-hidden">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="aspect-2/3 w-28 shrink-0 rounded-poster bg-surface-2 animate-pulse sm:w-32"
					/>
				))}
			</div>

			<div className="flex gap-2 mb-8">
				<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-10 w-20 rounded-lg bg-surface-2 animate-pulse" />
			</div>
			<MediaSectionsSkeleton sections={3} cardsPerSection={8} />
		</div>
	);
}
