interface MediaSectionsSkeletonProps {
    sections?: number
    cardsPerSection?: number
}

export function MediaSectionsSkeleton({ sections = 3, cardsPerSection = 8 }: MediaSectionsSkeletonProps) {
    return (
        <>
            {Array.from({ length: sections }).map((_, s) => (
                <div key={s} className="mb-12">
                    <div className="h-8 w-48 rounded bg-surface-2 animate-pulse mb-6" />
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: cardsPerSection }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-none w-40 aspect-2/3 rounded-(--radius-cinema) bg-surface-2 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </>
    )
}
