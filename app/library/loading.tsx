export default function LibraryLoading() {
	return (
		<div className="container mx-auto py-12 px-6">
			<div className="mb-10 space-y-3">
				<div className="h-9 w-56 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-4 w-36 rounded bg-surface-2 animate-pulse" />
			</div>

			<div className="flex gap-2 mb-8">
				<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="aspect-2/3 rounded-(--radius-cinema) bg-surface-2 animate-pulse"
					/>
				))}
			</div>
		</div>
	);
}
