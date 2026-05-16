"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/context"
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions"
import { SearchDropdown } from "./SearchDropdown"
import { cn } from "@/lib/utils"

interface SearchBarProps {
    variant?: "normal" | "compact"
    onClose?: () => void
    onNavigate?: () => void
    autoFocus?: boolean
}

export function SearchBar({ variant = "normal", onClose, onNavigate, autoFocus = false }: SearchBarProps) {
    const { t } = useTranslation()
    const [query, setQuery] = useState("")
    const { results, isLoading, isOpen, setIsOpen } = useSearchSuggestions(query)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const isCompact = variant === "compact"

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                onClose?.()
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [setIsOpen, onClose])

    const handleSelect = () => {
        setIsOpen(false)
        onClose?.()
        onNavigate?.()
    }

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (query.trim().length < 2) return
        handleSelect()
        router.push(`/explorer/search?q=${encodeURIComponent(query.trim())}`)
    }

    return (
        <div
            className={cn("relative w-full", !isCompact && "max-w-3xl mx-auto mb-8 md:mb-12")}
            ref={dropdownRef}
        >
            <form onSubmit={handleSearch} className="relative group flex items-center" role="search">
                <label htmlFor={isCompact ? "search-input-compact" : "search-input"} className="sr-only">
                    {t.pages.search.placeholder}
                </label>
                <Input
                    id={isCompact ? "search-input-compact" : "search-input"}
                    type="text"
                    placeholder={t.pages.search.placeholder}
                    autoComplete="off"
                    className={cn(
                        "transition-all duration-(--duration-base) ease-apple",
                        isCompact
                            ? "pl-10 pr-8 py-2 h-10 bg-surface-2/50 backdrop-blur border border-border/30 hover:border-border/50 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background text-sm shadow-sm rounded-lg"
                            : "pl-16 pr-10 py-3 h-16 bg-glass-bg backdrop-blur-xl border border-glass-border hover:border-glass-border-hover focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background text-base shadow-card rounded-(--radius-xl)"
                    )}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    autoFocus={autoFocus}
                />

                <div
                    className={cn(
                        "absolute left-0 inset-y-0 flex items-center pointer-events-none transition-all duration-(--duration-fast) ease-apple",
                        isCompact ? "pl-3 group-focus-within:text-primary" : "pl-5 group-focus-within:text-red"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className={cn("animate-spin text-muted", isCompact ? "w-4 h-4" : "w-6 h-6")} />
                    ) : isCompact ? (
                        <Search className="w-4 h-4 text-muted transition-all duration-(--duration-fast) ease-apple group-focus-within:scale-110" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <Search className="w-6 h-6 text-muted transition-all duration-(--duration-fast) ease-apple group-focus-within:scale-110" />
                            <div className="w-px h-7 bg-border/30" />
                        </div>
                    )}
                </div>

                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label={t.common.clearSearch}
                        className={cn(
                            "absolute inset-y-0 flex items-center text-muted hover:text-text transition-all duration-(--duration-fast) ease-apple",
                            isCompact ? "right-2" : "right-3 hover:scale-110"
                        )}
                    >
                        <X className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
                    </button>
                )}
            </form>

            <SearchDropdown
                query={query}
                results={results}
                isOpen={isOpen}
                isLoading={isLoading}
                onClose={handleSelect}
            />
        </div>
    )
}
