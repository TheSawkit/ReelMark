"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Film, Tv } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { startTransition } from "react"

interface MediaTypeSwitcherProps {
    defaultType?: "movie" | "tv"
}

export function MediaTypeSwitcher({ defaultType = "movie" }: MediaTypeSwitcherProps) {
    const { t } = useTranslation()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentType = searchParams.get("type") || defaultType

    const setType = (type: "movie" | "tv") => {
        if (currentType === type) return

        const params = new URLSearchParams(searchParams.toString())
        params.set("type", type)

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
    }

    return (
        <div className="flex justify-center mb-8">
            <div className="relative inline-flex items-center p-1 bg-surface/80 backdrop-blur-md rounded-xl border border-border/10 shadow-card-xs isolate">
                <div 
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg transition-transform duration-(--duration-base) ease-in-out -z-10",
                        currentType === "movie" ? "translate-x-0" : "translate-x-full"
                    )}
                />
                <button
                    onClick={() => setType("movie")}
                    className={cn(
                        "flex flex-1 justify-center items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-(--duration-base)",
                        currentType === "movie"
                            ? "text-white shadow-cinema"
                            : "text-muted hover:text-text"
                    )}
                >
                    <Film className="w-4 h-4" />
                    {t.movie.films}
                </button>
                <button
                    onClick={() => setType("tv")}
                    className={cn(
                        "flex flex-1 justify-center items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-(--duration-base)",
                        currentType === "tv"
                            ? "text-white shadow-cinema"
                            : "text-muted hover:text-text"
                    )}
                >
                    <Tv className="w-4 h-4" />
                    {t.movie.series}
                </button>
            </div>
        </div>
    )
}
