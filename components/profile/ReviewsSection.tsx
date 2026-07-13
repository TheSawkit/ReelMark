'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { deleteReview, getUserReviews } from '@/app/actions/reviews';
import { getImageUrl } from '@/lib/tmdb/images';
import type { Review, PrivacyVisibility } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { useInView } from '@/hooks/useInView';
import { PrivacyBlock } from '@/components/profile/PrivacyBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { StarRating } from '@/components/ui/StarRating';
import { DeleteIconButton } from '@/components/ui/DeleteIconButton';
import { Button } from '@/components/ui/button';
import { ReviewDialog } from '@/components/media/reviews/ReviewDialog';

interface ReviewsSectionProps {
	reviews: Review[];
	initialNextCursor: string | null;
	profileUserId: string;
	visibility: PrivacyVisibility;
	canView: boolean;
	isOwnProfile: boolean;
}

export function ReviewsSection({
	reviews: initial,
	initialNextCursor,
	profileUserId,
	visibility,
	canView,
	isOwnProfile,
}: ReviewsSectionProps) {
	const { t, lang } = useTranslation();
	const [reviews, setReviews] = useState(initial);
	const [isPending, startTransition] = useTransition();
	const [editingReview, setEditingReview] = useState<Review | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const [nextCursor, setNextCursor] = useState(initialNextCursor);
	const [isLoadingMore, startLoadMoreTransition] = useTransition();
	const [loadError, setLoadError] = useState<string | null>(null);
	const loaderRef = useRef<HTMLDivElement | null>(null);
	const isLoaderVisible = useInView(loaderRef, {
		rootMargin: '0px 0px 400px 0px',
	});

	const loadMore = useCallback(() => {
		if (!nextCursor || isLoadingMore) return;
		startLoadMoreTransition(async () => {
			setLoadError(null);
			try {
				const page = await getUserReviews(profileUserId, nextCursor);
				setReviews((prev) => {
					const seen = new Set(prev.map((r) => r.id));
					return [
						...prev,
						...page.reviews.filter((r) => !seen.has(r.id)),
					];
				});
				setNextCursor(page.nextCursor);
			} catch {
				setLoadError(t.common.actionError);
			}
		});
	}, [nextCursor, isLoadingMore, profileUserId, t, startLoadMoreTransition]);

	useEffect(() => {
		if (isLoaderVisible && nextCursor && !isLoadingMore) loadMore();
	}, [isLoaderVisible, nextCursor, isLoadingMore, loadMore]);

	const handleDeleteClick = (reviewId: string) => {
		setConfirmDeleteId(reviewId);
	};

	const handleDeleteConfirm = (reviewId: string) => {
		setConfirmDeleteId(null);
		startTransition(async () => {
			try {
				await deleteReview(reviewId);
				setReviews((prev) => prev.filter((r) => r.id !== reviewId));
			} catch {
				toast.error(t.common.actionError);
			}
		});
	};

	if (!canView) return <PrivacyBlock visibility={visibility} />;
	if (reviews.length === 0)
		return <EmptyState message={t.profile.noReviews} />;

	return (
		<>
			<div className="space-y-3">
				{reviews.map((review) => (
					<article
						key={review.id}
						className="flex gap-3 p-3 rounded-lg bg-surface border border-border-subtle shadow-card-sm"
					>
						{review.media_type !== 'episode' ? (
							<Link
								href={localizedHref(
									lang,
									`/${review.media_type}/${review.media_id}`
								)}
								prefetch={false}
								className="shrink-0"
							>
								<div className="relative w-12 aspect-2/3 rounded-poster overflow-hidden bg-surface-2">
									{review.poster_path ? (
										<Image
											src={getImageUrl(
												review.poster_path,
												'w92'
											)}
											alt={review.media_title}
											fill
											unoptimized
											sizes="48px"
											className="object-cover"
										/>
									) : (
										<div className="w-full h-full bg-surface-3" />
									)}
								</div>
							</Link>
						) : (
							<div className="relative shrink-0 w-12 aspect-2/3 rounded-poster overflow-hidden bg-surface-2">
								{review.poster_path ? (
									<Image
										src={getImageUrl(
											review.poster_path,
											'w92'
										)}
										alt={review.media_title}
										fill
										unoptimized
										sizes="48px"
										className="object-cover"
									/>
								) : (
									<div className="w-full h-full bg-surface-3" />
								)}
							</div>
						)}

						<div className="flex-1 min-w-0">
							{review.media_type !== 'episode' ? (
								<Link
									href={localizedHref(
										lang,
										`/${review.media_type}/${review.media_id}`
									)}
									prefetch={false}
								>
									<p className="font-medium text-sm text-text hover:text-primary transition-colors truncate">
										{review.media_title}
									</p>
								</Link>
							) : (
								<p className="font-medium text-sm text-text truncate">
									{review.media_title}
								</p>
							)}
							{review.rating != null && (
								<div className="mt-1">
									<StarRating
										value={review.rating}
										size="sm"
									/>
								</div>
							)}
							{review.content && (
								<p className="mt-1.5 text-sm text-muted leading-relaxed line-clamp-3">
									{review.content}
								</p>
							)}
						</div>

						{isOwnProfile && (
							<div className="flex items-start gap-0.5 shrink-0">
								{confirmDeleteId === review.id ? (
									<div className="flex items-center gap-1 animate-in fade-in duration-(--duration-instant)">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleDeleteConfirm(review.id)
											}
											disabled={isPending}
											className="h-8 px-2 text-xs text-red-2 hover:text-red hover:bg-red/10"
										>
											{t.common.confirm}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setConfirmDeleteId(null)
											}
											className="h-8 px-2 text-xs text-muted"
										>
											{t.common.cancel}
										</Button>
									</div>
								) : (
									<>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setEditingReview(review)
											}
											disabled={isPending}
											className="h-8 w-8 p-0 text-muted hover:text-text"
											aria-label={t.movie.editReview}
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<DeleteIconButton
											onClick={() =>
												handleDeleteClick(review.id)
											}
											disabled={isPending}
											ariaLabel={t.profile.deleteReview}
										/>
									</>
								)}
							</div>
						)}
					</article>
				))}
			</div>

			{nextCursor && (
				<div ref={loaderRef} aria-hidden="true" className="h-px" />
			)}
			{isLoadingMore && (
				<div className="flex justify-center py-4">
					<Loader2
						className="h-5 w-5 animate-spin text-muted"
						aria-hidden
					/>
				</div>
			)}
			{loadError && <FormError className="py-2">{loadError}</FormError>}

			{editingReview && (
				<ReviewDialog
					key={editingReview.id}
					open={true}
					onClose={() => setEditingReview(null)}
					mediaId={editingReview.media_id}
					mediaType={editingReview.media_type}
					mediaTitle={editingReview.media_title}
					posterPath={editingReview.poster_path}
					tvId={editingReview.tv_id}
					seasonNumber={editingReview.season_number}
					existingReview={editingReview}
					onSave={(saved) =>
						setReviews((prev) =>
							prev.map((r) =>
								r.id === editingReview.id ? saved : r
							)
						)
					}
					onDelete={() =>
						setReviews((prev) =>
							prev.filter((r) => r.id !== editingReview.id)
						)
					}
				/>
			)}
		</>
	);
}
