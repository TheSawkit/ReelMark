export function DetailBannerSkeleton() {
    return (
        <div className="relative w-full -mt-16 min-h-[70vh] md:min-h-[80vh] bg-surface-2 animate-pulse flex items-end pb-12">
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="flex gap-6 md:gap-8 items-end">
                    <div className="hidden md:block w-48 lg:w-56 aspect-2/3 rounded-lg bg-surface/50 border-2 border-border/10 h-full" />

                    <div className="flex-1 space-y-4">
                        <div className="h-12 md:h-16 lg:h-20 w-3/4 bg-surface/50 rounded-lg" />
                        <div className="h-6 w-1/2 bg-surface/30 rounded" />
                        <div className="flex gap-4">
                            <div className="h-8 w-16 rounded-full bg-surface/50" />
                            <div className="h-8 w-32 rounded-full bg-surface/50" />
                            <div className="h-8 w-24 rounded-full bg-surface/50" />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <div className="h-10 w-32 rounded-md bg-surface/60" />
                            <div className="h-10 w-32 rounded-md bg-surface/40" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CastRowSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-40 bg-surface-2 rounded animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-none w-32 space-y-2">
                        <div className="aspect-square rounded-full bg-surface-2 animate-pulse" />
                        <div className="h-4 w-20 bg-surface-2 mx-auto rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    )
}
