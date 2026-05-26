import { PageLayout } from '@/components/layout/PageLayout'
import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton'

export default function PlaylistLoading() {
    return (
        <>
            <div className="relative -mt-16 min-h-[55vh] flex flex-col justify-end bg-surface-2 animate-pulse">
                <div className="container mx-auto px-6 lg:px-12 pt-32 pb-10 md:pb-14 flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-12">
                    <div className="flex-1 space-y-5">
                        <div className="flex gap-2">
                            <div className="h-8 w-10 rounded-full bg-surface-3" />
                            <div className="h-8 w-20 rounded-full bg-surface-3" />
                            <div className="h-8 w-28 rounded-full bg-surface-3" />
                        </div>
                        <div className="h-14 md:h-16 bg-surface-3 rounded-lg w-80 max-w-full" />
                        <div className="h-5 bg-surface-3 rounded w-64 max-w-full" />
                        <div className="flex gap-3">
                            <div className="h-9 w-28 rounded-lg bg-surface-3" />
                            <div className="h-9 w-20 rounded-lg bg-surface-3" />
                        </div>
                    </div>
                    <div className="hidden lg:flex items-end gap-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-24 aspect-2/3 rounded-poster bg-surface-3"
                                style={{ marginLeft: i > 0 ? '-1.5rem' : 0, zIndex: 5 - i }}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <PageLayout className="pt-8 md:pt-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <MediaCardSkeleton key={i} />
                    ))}
                </div>
            </PageLayout>
        </>
    )
}
