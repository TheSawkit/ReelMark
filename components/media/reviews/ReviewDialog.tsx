"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { StarRating } from "@/components/ui/StarRating"
import { Button } from "@/components/ui/button"
import { upsertReview, deleteReview } from "@/app/actions/reviews"
import { MAX_REVIEW_LENGTH } from "@/types/profile"
import { useTranslation } from "@/lib/i18n/context"
import type { Review, ReviewMediaType } from "@/types/profile"

interface ReviewDialogProps {
    open: boolean
    onClose: () => void
    mediaId: number
    mediaType: ReviewMediaType
    mediaTitle: string
    posterPath: string | null
    existingReview?: Review | null
    onSave?: (rating: number | null, content: string | null) => void
    onDelete?: () => void
}

export function ReviewDialog({
    open,
    onClose,
    mediaId,
    mediaType,
    mediaTitle,
    posterPath,
    existingReview,
    onSave,
    onDelete,
}: ReviewDialogProps) {
    const { t } = useTranslation()
    const [rating, setRating] = useState<number | null>(existingReview?.rating ?? null)
    const [content, setContent] = useState(existingReview?.content ?? "")
    const [isPending, startTransition] = useTransition()

    function handleOpenChange(open: boolean) {
        if (!open) onClose()
    }

    function handleSubmit() {
        startTransition(async () => {
            try {
                await upsertReview(mediaId, mediaType, mediaTitle, posterPath, rating, content.trim() || null)
                toast.success(t.movie.reviewSaved)
                onSave?.(rating, content.trim() || null)
                onClose()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : t.common.actionError)
            }
        })
    }

    function handleDelete() {
        if (!existingReview) return
        startTransition(async () => {
            try {
                await deleteReview(existingReview.id)
                toast.success(t.movie.reviewDeleted)
                onDelete?.()
                onClose()
            } catch {
                toast.error(t.common.actionError)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mediaType === "episode" ? t.movie.rateEpisode : mediaType === "tv" ? t.movie.rateTvShow : t.movie.rateMovie}
                    </DialogTitle>
                    <DialogDescription>
                        {mediaTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-5 py-5 space-y-5">
                    <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            {t.movie.yourRating}
                        </span>
                        <div className="flex items-center gap-3">
                            <StarRating value={rating} onChange={setRating} size="lg" />
                            {rating !== null && (
                                <span className="text-sm font-bold text-gold tabular-nums">
                                    {(rating / 2).toFixed(1)}<span className="text-muted font-normal">/5</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                            {t.movie.writeReview}
                        </span>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t.movie.reviewPlaceholder}
                            rows={5}
                            maxLength={MAX_REVIEW_LENGTH}
                            className="w-full rounded-lg bg-surface-2/40 border border-border/30 text-text text-sm px-3 py-2.5 placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        />
                        <p className="text-xs text-muted text-right tabular-nums">
                            {content.length.toLocaleString()} / {MAX_REVIEW_LENGTH.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="px-5 pb-5 flex items-center justify-between gap-3">
                    {existingReview ? (
                        <button
                            onClick={handleDelete}
                            disabled={isPending}
                            className="flex items-center gap-1.5 text-xs text-muted hover:text-red transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t.movie.deleteReview}
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
                            {t.movie.skipRating}
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={isPending || (rating === null && !content.trim())}>
                            {t.movie.submitReview}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
