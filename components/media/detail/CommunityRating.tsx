import { StarRating } from "@/components/ui/StarRating"
import { getTranslations } from "@/lib/i18n/server"

interface CommunityRatingProps {
    avg: number
    count: number
}

export async function CommunityRating({ avg, count }: CommunityRatingProps) {
    const t = await getTranslations()

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                {t.movie.communityRating}
            </span>
            <div className="flex items-center gap-2">
                <StarRating value={Math.round(avg)} size="sm" />
                <span className="text-sm font-bold text-gold tabular-nums">
                    {(avg / 2).toFixed(1)}<span className="text-muted font-normal">/5</span>
                </span>
                <span className="text-xs text-muted tabular-nums">
                    ({count} {t.movie.ratingsCount})
                </span>
            </div>
        </div>
    )
}
