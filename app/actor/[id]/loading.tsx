export default function ActorLoading() {
  return (
    <div className="min-h-screen">
      <div className="relative w-full h-[50vh] min-h-100 bg-surface-2 animate-pulse flex items-end pb-12">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex gap-6 md:gap-8 items-end">
            <div className="w-32 md:w-48 aspect-square rounded-full bg-surface/50 border-4 border-border/10 shrink-0" />

            <div className="flex-1 space-y-4">
              <div className="h-10 md:h-14 lg:h-16 w-1/2 bg-surface/50 rounded-lg" />
              <div className="h-5 w-1/3 bg-surface/30 rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 py-8 space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-surface-2 rounded animate-pulse" />
        </div>

        <div className="space-y-6">
          <div className="h-8 w-48 bg-surface-2 rounded animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-2/3 rounded-(--radius-cinema) bg-surface-2 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
