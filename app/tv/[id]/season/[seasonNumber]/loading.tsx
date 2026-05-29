export default function SeasonLoading() {
	return (
		<div className="min-h-screen pb-20">
			<div className="sticky top-16 z-30 w-full bg-surface/40 backdrop-blur-2xl border-b border-border/10 shadow-navbar">
				<div className="container mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
						<div className="space-y-2">
							<div className="h-4 w-36 bg-surface-2 rounded animate-pulse" />
							<div className="h-9 w-56 bg-surface-2 rounded-lg animate-pulse" />
						</div>
						<div className="h-10 w-32 rounded-lg bg-surface-2 animate-pulse" />
					</div>
				</div>
			</div>

			<div className="container mx-auto px-6 lg:px-12 py-10 space-y-8">
				<div className="space-y-6">
					<div className="h-8 w-44 bg-surface-2 rounded animate-pulse" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{Array.from({ length: 9 }).map((_, i) => (
							<div
								key={i}
								className="rounded-poster overflow-hidden bg-surface-2 animate-pulse"
							>
								<div className="aspect-video w-full bg-surface-3" />
								<div className="p-4 space-y-3">
									<div className="h-5 w-3/4 bg-surface-3 rounded" />
									<div className="h-3 w-1/2 bg-surface-3 rounded" />
									<div className="h-3 w-full bg-surface-3 rounded" />
									<div className="h-3 w-2/3 bg-surface-3 rounded" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
