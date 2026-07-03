export default function HomeLoading() {
	return (
		<div className="min-h-screen">
			<section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
				<div className="max-w-4xl mx-auto space-y-6 animate-pulse">
					<div className="h-5 w-24 rounded-full bg-surface-2 mx-auto" />
					<div className="space-y-3">
						<div className="h-16 w-full max-w-2xl rounded-xl bg-surface-2 mx-auto" />
						<div className="h-16 w-3/4 max-w-xl rounded-xl bg-surface-2 mx-auto" />
					</div>
					<div className="space-y-2">
						<div className="h-5 w-full max-w-lg rounded bg-surface-2 mx-auto" />
						<div className="h-5 w-2/3 max-w-sm rounded bg-surface-2 mx-auto" />
					</div>
					<div className="flex gap-4 justify-center pt-2">
						<div className="h-11 w-36 rounded-lg bg-surface-2" />
						<div className="h-11 w-36 rounded-lg bg-surface-2" />
					</div>
				</div>
			</section>
		</div>
	);
}
