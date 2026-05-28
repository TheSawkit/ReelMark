export default function SeasonLoading() {
  return (
    <div className="container mx-auto py-12 px-6">
      <div className="mb-8">
        <div className="h-6 w-32 rounded bg-surface-2 animate-pulse mb-8" />

        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          <div className="w-full md:w-64 lg:w-72 aspect-2/3 rounded-xl bg-surface-2 animate-pulse shadow-xl" />
          <div className="flex-1 space-y-6">
            <div className="h-10 w-2/3 rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-6 w-48 rounded bg-surface-2 animate-pulse" />

            <div className="space-y-3 pt-4">
              <div className="h-4 w-full rounded bg-surface-2 animate-pulse" />
              <div className="h-4 w-full rounded bg-surface-2 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-surface-2 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-surface-2 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-surface-2 animate-pulse aspect-video"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
