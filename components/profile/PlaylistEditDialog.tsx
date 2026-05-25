'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, ListVideo, Check, X, Save, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { addToPlaylist, removeFromPlaylist, updatePlaylist } from '@/app/actions/playlists'
import { getImageUrl } from '@/lib/tmdb/images'
import { getMediaKey } from '@/lib/media'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import type { Playlist, PlaylistItem } from '@/types/profile'
import type { MediaItem } from '@/types/tmdb'
import { useTranslation } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

type DialogMode = 'edit' | 'view'

interface PlaylistEditDialogProps {
    playlist: Playlist
    mode: DialogMode
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddItem: (item: PlaylistItem) => void
    onRemoveItem: (mediaId: number, mediaType: 'movie' | 'tv') => void
    onUpdateMeta?: (name: string, description: string | null) => void
    onSwitchToEdit?: () => void
}

export function PlaylistEditDialog({
    playlist,
    mode,
    open,
    onOpenChange,
    onAddItem,
    onRemoveItem,
    onUpdateMeta,
    onSwitchToEdit,
}: PlaylistEditDialogProps) {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')
    const { results: searchResults, isLoading: isSearching } = useSearchSuggestions(query)
    const [pendingAdd, setPendingAdd] = useState<string | null>(null)
    const [pendingRemove, setPendingRemove] = useState<string | null>(null)

    const [editName, setEditName] = useState(playlist.name)
    const [editDesc, setEditDesc] = useState(playlist.description ?? '')
    const [isSavingMeta, setIsSavingMeta] = useState(false)
    const nameRef = useRef<HTMLInputElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const items = playlist.items ?? []
    const inPlaylist = new Set(items.map(i => getMediaKey({ id: i.media_id, media_type: i.media_type })))
    const isSearchMode = mode === 'edit' && query.trim().length >= 2
    const hasAnyPending = pendingAdd !== null || pendingRemove !== null
    const metaChanged = editName.trim() !== playlist.name || (editDesc.trim() || null) !== playlist.description

    useEffect(() => {
        const focus = () => {
            if (mode === 'edit') inputRef.current?.focus()
        }
        if (open) focus()
    }, [open, mode])

    useEffect(() => {
        const reset = () => {
            setEditName(playlist.name)
            setEditDesc(playlist.description ?? '')
        }
        if (open) reset()
    }, [open, playlist.name, playlist.description])

    const handleSaveMeta = async () => {
        if (!editName.trim() || !metaChanged || isSavingMeta) return
        setIsSavingMeta(true)
        try {
            await updatePlaylist(playlist.id, editName.trim(), editDesc.trim() || null)
            onUpdateMeta?.(editName.trim(), editDesc.trim() || null)
        } catch {
            toast.error(t.profile.errorSavePlaylistMeta)
        } finally {
            setIsSavingMeta(false)
        }
    }

    const handleAdd = async (item: MediaItem) => {
        const key = getMediaKey(item)
        if (inPlaylist.has(key) || pendingAdd === key) return
        setPendingAdd(key)
        try {
            await addToPlaylist(playlist.id, item.id, item.media_type, item.title, item.poster_path ?? null)
            onAddItem({
                id: crypto.randomUUID(),
                playlist_id: playlist.id,
                media_id: item.id,
                media_type: item.media_type,
                media_title: item.title,
                poster_path: item.poster_path ?? null,
                added_at: new Date().toISOString(),
            })
            setQuery('')
        } catch {
            toast.error(t.profile.errorAdd)
        } finally {
            setPendingAdd(null)
        }
    }

    const handleRemove = async (item: PlaylistItem) => {
        const key = getMediaKey({ id: item.media_id, media_type: item.media_type })
        if (pendingRemove === key) return
        setPendingRemove(key)
        try {
            await removeFromPlaylist(playlist.id, item.media_id, item.media_type)
            onRemoveItem(item.media_id, item.media_type)
        } catch {
            toast.error(t.profile.errorRemove)
        } finally {
            setPendingRemove(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl h-[85dvh] flex flex-col gap-0 p-0 overflow-hidden"
                onInteractOutside={(e) => { if (hasAnyPending || isSavingMeta) e.preventDefault() }}
            >
                <div className="shrink-0 px-5 pt-5 pb-4 border-b border-border-subtle space-y-3">
                    {mode === 'view' && onSwitchToEdit && (
                        <button
                            onClick={onSwitchToEdit}
                            className="absolute right-11 top-4 rounded-md p-1 text-muted hover:text-text hover:bg-surface-2 transition-colors z-10"
                            aria-label={t.profile.editPlaylist}
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                    <div className={cn("flex items-start justify-between", mode === 'view' && onSwitchToEdit ? "pr-14" : "pr-7")}>
                        <div className="min-w-0 flex-1">
                            {mode === 'edit' ? (
                                <div className="space-y-1">
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={handleSaveMeta}
                                        placeholder={t.profile.playlistName}
                                        className="w-full text-base font-semibold text-text bg-transparent outline-none border-b border-transparent focus:border-border-subtle transition-colors placeholder:text-muted truncate"
                                    />
                                    <input
                                        type="text"
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        onBlur={handleSaveMeta}
                                        placeholder={t.profile.playlistDescription}
                                        className="w-full text-xs text-muted bg-transparent outline-none border-b border-transparent focus:border-border-subtle transition-colors placeholder:text-muted/50 truncate"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-base font-semibold text-text truncate">{playlist.name}</h2>
                                    {playlist.description && (
                                        <p className="text-xs text-muted mt-0.5 truncate">{playlist.description}</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3 mt-0.5">
                            {mode === 'edit' && metaChanged && (
                                <button
                                    onClick={handleSaveMeta}
                                    disabled={isSavingMeta || !editName.trim()}
                                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
                                    aria-label={t.profile.savePlaylistMeta}
                                >
                                    {isSavingMeta
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Save className="h-3.5 w-3.5" />
                                    }
                                </button>
                            )}
                            <span className="text-xs text-muted whitespace-nowrap">
                                {items.length} {t.profile.items}
                            </span>
                        </div>
                    </div>

                    {mode === 'edit' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t.profile.searchContent}
                                className="w-full h-10 pl-10 pr-10 rounded-lg bg-surface-2 border border-border-subtle text-sm text-text placeholder:text-muted outline-none focus:border-border transition-colors"
                            />
                            {isSearching ? (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin pointer-events-none" />
                            ) : query ? (
                                <button
                                    onClick={() => setQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted hover:text-text transition-colors"
                                    aria-label={t.common.clearSearch}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {isSearchMode ? (
                        <SearchResultList
                            results={searchResults}
                            query={query}
                            isLoading={isSearching}
                            inPlaylist={inPlaylist}
                            pendingAdd={pendingAdd}
                            onAdd={handleAdd}
                        />
                    ) : (
                        <PlaylistGrid
                            items={items}
                            mode={mode}
                            pendingRemove={pendingRemove}
                            onRemove={handleRemove}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}


const CARD_BASE = cn(
    'group relative rounded-poster bg-surface border border-card-border block',
    'transition-[transform,box-shadow,border-color] duration-(--duration-medium) ease-apple will-change-transform',
    'hover:scale-[1.03] hover:border-gold/40 hover:shadow-poster hover:z-10',
)

const HOVER_OVERLAY = cn(
    'absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-transparent',
    'transition-opacity duration-(--duration-base) opacity-0 group-hover:opacity-100',
    'pointer-events-none',
)

const HOVER_TITLE = cn(
    'absolute inset-x-0 bottom-0 p-3 z-10',
    'translate-y-3 opacity-0 transition-all duration-(--duration-base)',
    'group-hover:translate-y-0 group-hover:opacity-100',
    'pointer-events-none',
)

function PlaylistGrid({ items, mode, pendingRemove, onRemove }: {
    items: PlaylistItem[]
    mode: DialogMode
    pendingRemove: string | null
    onRemove: (item: PlaylistItem) => void
}) {
    const { t } = useTranslation()

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-60 gap-4 px-8 text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
                    <ListVideo className="h-8 w-8 text-muted opacity-40" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-text">{t.profile.noPlaylists}</p>
                    {mode === 'edit' && (
                        <p className="text-xs text-muted">{t.profile.searchContent}</p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {items.map((item) => {
                const key = getMediaKey({ id: item.media_id, media_type: item.media_type })
                const isRemoving = pendingRemove === key
                return (
                    <div key={item.id} className={CARD_BASE}>
                        <Link href={`/${item.media_type}/${item.media_id}`} className="block relative aspect-2/3 w-full overflow-hidden rounded-poster">
                            {item.poster_path ? (
                                <Image
                                    src={getImageUrl(item.poster_path, 'w342')}
                                    alt={item.media_title}
                                    fill
                                    sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 22vw"
                                    className="object-cover transition-transform duration-(--duration-base) ease-out group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                                    <ListVideo className="h-6 w-6 text-muted opacity-30" />
                                </div>
                            )}
                            <div className={HOVER_OVERLAY} />
                            <div className={HOVER_TITLE}>
                                <p className="text-sm font-bold text-white leading-tight line-clamp-2">
                                    {item.media_title}
                                </p>
                            </div>
                        </Link>

                        {mode === 'edit' && (
                            <button
                                onClick={() => !isRemoving && onRemove(item)}
                                disabled={isRemoving}
                                aria-label={t.profile.removeFromPlaylistItem}
                                className={cn(
                                    'absolute top-2 right-2 z-20',
                                    'w-6 h-6 rounded-full flex items-center justify-center',
                                    'bg-background/75 backdrop-blur-sm border border-white/10 shadow-sm',
                                    'transition-all duration-(--duration-instant)',
                                    'sm:opacity-0 sm:scale-75 sm:group-hover:opacity-100 sm:group-hover:scale-100',
                                    isRemoving
                                        ? 'opacity-100 scale-100'
                                        : 'cursor-pointer hover:bg-red/20 hover:border-red/30',
                                )}
                            >
                                {isRemoving
                                    ? <Loader2 className="h-3 w-3 animate-spin text-muted" />
                                    : <X className="h-3 w-3 text-white" />
                                }
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function SearchResultList({ results, query, isLoading, inPlaylist, pendingAdd, onAdd }: {
    results: MediaItem[]
    query: string
    isLoading: boolean
    inPlaylist: Set<string>
    pendingAdd: string | null
    onAdd: (item: MediaItem) => void
}) {
    const { t } = useTranslation()

    if (results.length === 0) {
        if (isLoading) return (
            <div className="flex items-center justify-center min-h-32 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
        )
        return (
            <div className="flex flex-col items-center justify-center min-h-32 gap-1.5 text-center px-6 py-6">
                <p className="text-sm font-medium text-text">{t.profile.noSearchResults}</p>
                {query.trim() && <p className="text-xs text-muted">« {query.trim()} »</p>}
            </div>
        )
    }

    return (
        <ul className="p-2 list-none">
            {results.map((item) => {
                const key = getMediaKey(item)
                const added = inPlaylist.has(key)
                const pending = pendingAdd === key
                return (
                    <li key={key} role="presentation">
                        <button
                            type="button"
                            disabled={added || pending}
                            onClick={() => onAdd(item)}
                            className={cn(
                                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl",
                                "transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                                added ? "opacity-60 cursor-default" : "hover:bg-surface-2 cursor-pointer",
                            )}
                        >
                            <div className="relative w-9 h-14 shrink-0 rounded-poster overflow-hidden bg-surface-3">
                                {item.poster_path && (
                                    <Image
                                        src={getImageUrl(item.poster_path, "w92")}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 text-left">
                                <span className="text-sm font-semibold text-text truncate">
                                    {item.title}
                                </span>
                                <span className="text-xs text-muted">
                                    {item.release_date ? new Date(item.release_date).getFullYear() : "—"}
                                </span>
                            </div>
                            <div className="shrink-0 w-5 flex items-center justify-center">
                                {pending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
                                ) : added ? (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                ) : null}
                            </div>
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}
