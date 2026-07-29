'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { StarRating } from '@/components/ui/StarRating';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';
import type { PublicReview } from '@/types/profile';
import { useBrokenImage } from '@/hooks/useBrokenImage';

function relativeDate(dateStr: string, lang: string): string {
	const days = Math.floor(
		(Date.now() - new Date(dateStr).getTime()) / 86_400_000
	);
	const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
	if (days < 30) return rtf.format(-days, 'day');
	const months = Math.floor(days / 30);
	if (months < 12) return rtf.format(-months, 'month');
	return rtf.format(-Math.floor(months / 12), 'year');
}

function Avatar({
	username,
	avatarUrl,
}: {
	username: string;
	avatarUrl: string | null;
}) {
	const initial = (username[0] ?? '?').toUpperCase();
	const broken = useBrokenImage(avatarUrl);
	return (
		<div className="relative h-8 w-8 rounded-full overflow-hidden bg-surface-2 border border-border/20 shrink-0">
			{avatarUrl && !broken.isBroken ? (
				<Image
					src={avatarUrl}
					alt={username}
					fill
					sizes="32px"
					className="object-cover"
					referrerPolicy="no-referrer"
					onError={broken.onError}
				/>
			) : (
				<span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text">
					{initial}
				</span>
			)}
		</div>
	);
}

function ReviewCard({
	review,
	lang,
	clamp,
}: {
	review: PublicReview;
	lang: Language;
	clamp: boolean;
}) {
	return (
		<article className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<Link
					href={localizedHref(lang, `/profile/${review.username}`)}
					prefetch={false}
					className="flex items-center gap-2.5 min-w-0 group"
				>
					<Avatar
						username={review.username}
						avatarUrl={review.avatar_url}
					/>
					<span className="font-semibold text-sm text-text truncate group-hover:text-primary transition-colors">
						@{review.username}
					</span>
				</Link>
				<div className="flex items-center gap-2.5 shrink-0">
					{review.rating != null && (
						<StarRating value={review.rating} size="sm" />
					)}
					<span className="text-xs text-muted tabular-nums">
						{relativeDate(review.created_at, lang)}
					</span>
				</div>
			</div>
			{review.content && (
				<p
					className={`text-sm text-muted leading-relaxed pl-10 ${clamp ? 'line-clamp-2' : ''}`}
				>
					{review.content}
				</p>
			)}
		</article>
	);
}

interface ReviewsListProps {
	reviews: PublicReview[];
	triggerOnly?: boolean;
}

export function ReviewsList({
	reviews,
	triggerOnly = false,
}: ReviewsListProps) {
	const { t, lang } = useTranslation();
	const [open, setOpen] = useState(false);

	const sheet = (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-surface border-border/10">
				<SheetHeader className="px-6 py-5 border-b border-border/10 shrink-0">
					<SheetTitle className="text-left text-text">
						{t.movie.communityReviews}
						<span className="text-muted font-normal ml-1.5">
							({reviews.length})
						</span>
					</SheetTitle>
				</SheetHeader>
				<div className="flex-1 overflow-y-auto px-6 divide-y divide-border/10">
					{reviews.map((review) => (
						<div key={review.id} className="py-4">
							<ReviewCard
								review={review}
								lang={lang}
								clamp={false}
							/>
						</div>
					))}
				</div>
			</SheetContent>
		</Sheet>
	);

	if (triggerOnly) {
		return (
			<>
				<button
					onClick={() => setOpen(true)}
					className="text-xs font-semibold text-muted hover:text-primary transition-colors cursor-pointer"
				>
					{reviews.length} {t.movie.reviewsCount}
				</button>
				{sheet}
			</>
		);
	}

	const preview = reviews.slice(0, 3);

	return (
		<>
			<div className="divide-y divide-border/10">
				{preview.map((review) => (
					<div key={review.id} className="py-4 first:pt-0 last:pb-0">
						<ReviewCard review={review} lang={lang} clamp />
					</div>
				))}
			</div>

			{reviews.length > 3 && (
				<button
					onClick={() => setOpen(true)}
					className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer mt-2"
				>
					{t.movie.seeAllReviews} ({reviews.length})
					<ChevronRight className="h-4 w-4" />
				</button>
			)}

			{sheet}
		</>
	);
}
