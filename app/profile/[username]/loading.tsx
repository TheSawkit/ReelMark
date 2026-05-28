import { Skeleton } from '@/components/ui/skeleton';
import { PageLayout } from '@/components/layout/PageLayout';

export default function ProfileLoading() {
    return (
        <PageLayout>
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
                <Skeleton className="w-22 h-22 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                    <div className="flex gap-2 mt-3">
                        <Skeleton className="h-7 w-20 rounded-md" />
                        <Skeleton className="h-7 w-20 rounded-md" />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 border-b border-border-subtle mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20" />
                ))}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                        <Skeleton className="w-full aspect-2/3 rounded-poster" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                ))}
            </div>
        </PageLayout>
    );
}
