import { PageLayout } from '@/components/layout/PageLayout';

export default function LibraryLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<div className="h-9 w-56 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-4 w-36 rounded bg-surface-2 animate-pulse" />
			</div>

			<div className="flex gap-2 mb-8">
				<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
			</div>

			<div className="flex gap-2 border-b border-border pb-0 mb-8">
				<div className="h-10 w-24 rounded-t-lg bg-surface-2 animate-pulse" />
				<div className="h-10 w-20 rounded-t-lg bg-surface-2 animate-pulse" />
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="aspect-2/3 rounded-(--radius-cinema) bg-surface-2 animate-pulse"
					/>
				))}
			</div>
		</PageLayout>
	);
}
