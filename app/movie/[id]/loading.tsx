import {
  DetailBannerSkeleton,
  CastRowSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';

export default function MovieLoading() {
  return (
    <div className="min-h-screen">
      <DetailBannerSkeleton />

      <div className="container mx-auto px-6 lg:px-12 py-8 space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-surface-2 rounded animate-pulse" />
        </div>

        <CastRowSkeleton />
      </div>
    </div>
  );
}
