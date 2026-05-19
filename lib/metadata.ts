import type { Metadata } from "next"
import { getImageUrl } from "@/lib/tmdb/images"

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://reelmark.app"

interface MediaMetadataOptions {
    title: string
    description: string
    backdropPath: string | null | undefined
    canonical: string
    ogType: "video.movie" | "video.tv_show"
}

interface PageMetadataOptions {
    isPrivate?: boolean
    canonical?: string
}

/** Builds standard Next.js Metadata for static app pages, avoiding title/description repetition. */
export function buildPageMetadata(title: string, description: string, options?: PageMetadataOptions): Metadata {
    return {
        title,
        description,
        ...(options?.isPrivate && { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } }),
        ...(options?.canonical && { alternates: { canonical: options.canonical } }),
        openGraph: { title, description, type: "website" },
        twitter: { card: "summary", title, description },
    }
}

/** Builds canonical Next.js Metadata for a movie or TV show detail page. */
export function buildMediaMetadata({ title, description, backdropPath, canonical, ogType }: MediaMetadataOptions): Metadata {
    const backdropUrl = backdropPath ? getImageUrl(backdropPath, "w1280") : undefined
    const images = backdropUrl ? [{ url: backdropUrl, width: 1280, height: 720 }] : []

    return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
            title,
            description,
            type: ogType,
            images: images.length > 0 ? images : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: images.length > 0 ? [images[0].url] : undefined,
        },
    }
}
