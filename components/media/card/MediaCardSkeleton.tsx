export function MediaCardSkeleton() {
    return (
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface-2 animate-pulse">
            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1.5">
                <div className="h-3 bg-surface-3 rounded w-3/4" />
                <div className="h-2.5 bg-surface-3 rounded w-1/2" />
            </div>
        </div>
    )
}
