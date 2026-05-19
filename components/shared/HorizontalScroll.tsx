"use client"

import { useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/context"
import type { HorizontalScrollProps } from "@/types/components"

export function HorizontalScroll({
  children,
  title,
  scrollAmount = 500,
  className = "",
  containerClassName = "",
}: HorizontalScrollProps) {
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -scrollAmount : scrollAmount
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }, [scrollAmount])

  return (
    <div className={`group/section ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4 px-1">
          {title}
          <div className="hidden md:flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-(--duration-base)">
            <Button
              variant="outline"
              size="icon"
              aria-label={t.common.scrollLeft}
              className="h-10 w-10 rounded-full bg-background/50 backdrop-blur-sm border-surface-3 hover:bg-surface-2 hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t.common.scrollRight}
              className="h-10 w-10 rounded-full bg-background/50 backdrop-blur-sm border-surface-3 hover:bg-surface-2 hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={`flex gap-4 overflow-x-auto py-5 -my-5 px-4 -mx-4 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${containerClassName}`}
      >
        {children}
      </div>
    </div>
  )
}
