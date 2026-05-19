"use client"

import Link from "next/link"
import Image from "next/image"
import { PlayCircle } from "lucide-react"
import type { MediaItem } from "@/types/tmdb"
import { getImageUrl } from "@/lib/tmdb/images"
import { useTranslation } from "@/lib/i18n/context"

interface SearchDropdownProps {
    query: string
    results: MediaItem[]
    isOpen: boolean
    isLoading: boolean
    onClose: () => void
}

export function SearchDropdown({ query, results, isOpen, isLoading, onClose }: SearchDropdownProps) {
    const { t } = useTranslation()

    if (!isOpen) return null

    if (query.length >= 2 && !isLoading && results.length === 0) {
        return (
            <div className="absolute top-full mt-2 w-full bg-glass-bg backdrop-blur-xl border border-glass-border rounded-(--radius-xl) p-8 text-center shadow-card z-50 animate-in fade-in slide-in-from-top-2 duration-(--duration-fast) ease-apple">
                <p className="text-muted text-base">{t.pages.search.noResults} &quot;{query}&quot;</p>
            </div>
        )
    }

    if (results.length === 0) return null

    return (
        <div
            className="absolute top-full mt-2 w-full bg-glass-bg backdrop-blur-xl border border-glass-border rounded-(--radius-xl) shadow-search-dropdown overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-(--duration-fast) ease-apple"
        >
            <div className="p-2">
                {results.map((item) => (
                    <Link
                        key={item.id}
                        href={item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`}
                        className="flex items-center gap-4 p-2 hover:bg-glass-bg-hover rounded-xl transition-all duration-(--duration-fast) ease-apple group relative overflow-hidden"
                        onClick={onClose}
                    >
                        <div className="relative w-12 h-18 shrink-0 rounded-lg overflow-hidden shadow-card-xs">
                            <Image
                                src={getImageUrl(item.poster_path, "w92")}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-(--duration-slow)"
                            />
                            <div className="absolute inset-0 bg-red/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircle className="w-6 h-6 text-white drop-shadow-sm" />
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text truncate group-hover:text-red transition-colors duration-(--duration-fast) ease-apple">
                                {item.title}
                            </span>
                            <span className="text-sm text-muted">
                                {item.release_date
                                    ? new Date(item.release_date).getFullYear()
                                    : t.movie.notRated}
                            </span>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                            <span className="text-xs font-bold px-2 py-1 bg-red/10 text-red rounded-full border border-red/20">
                                {t.common.view}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="bg-surface-2 px-4 py-3 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted">{t.explorer.searchResults}</span>
                <Link
                    href={`/explorer/search?q=${encodeURIComponent(query)}`}
                    className="text-xs font-bold text-red hover:underline"
                    onClick={onClose}
                >
                    {t.common.viewAll}
                </Link>
            </div>
        </div>
    )
}
