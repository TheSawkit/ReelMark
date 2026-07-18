'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, X, Save, Pencil, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import {
	Dialog,
	DialogContent,
	DialogDescription,
} from '@/components/ui/dialog';
import {
	addToPlaylist,
	removeFromPlaylist,
	updatePlaylist,
	updatePlaylistVisibility,
} from '@/app/actions/playlists';
import { getMediaKey } from '@/lib/media';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import type {
	Playlist,
	PlaylistItem,
	PrivacyVisibility,
} from '@/types/profile';
import type { MediaItem } from '@/types/tmdb';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { VisibilitySelector } from '@/components/profile/VisibilitySelector';
import { PlaylistGrid } from '@/components/profile/PlaylistGrid';
import { PlaylistSearchResults } from '@/components/profile/PlaylistSearchResults';
import { BASE_URL } from '@/lib/metadata';

type DialogMode = 'edit' | 'view';

interface PlaylistEditDialogProps {
	playlist: Playlist;
	mode: DialogMode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddItem: (item: PlaylistItem) => void;
	onRemoveItem: (mediaId: number, mediaType: 'movie' | 'tv') => void;
	onUpdateMeta?: (name: string, description: string | null) => void;
	onUpdateVisibility?: (visibility: PrivacyVisibility) => void;
	onSwitchToEdit?: () => void;
}

export function PlaylistEditDialog({
	playlist,
	mode,
	open,
	onOpenChange,
	onAddItem,
	onRemoveItem,
	onUpdateMeta,
	onUpdateVisibility,
	onSwitchToEdit,
}: PlaylistEditDialogProps) {
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const { results: searchResults, isLoading: isSearching } =
		useSearchSuggestions(query);
	const [pendingAdd, setPendingAdd] = useState<string | null>(null);
	const [pendingRemove, setPendingRemove] = useState<string | null>(null);

	const [editName, setEditName] = useState(playlist.name);
	const [editDesc, setEditDesc] = useState(playlist.description ?? '');
	const [currentVisibility, setCurrentVisibility] =
		useState<PrivacyVisibility>(playlist.visibility);
	const [isSavingMeta, setIsSavingMeta] = useState(false);
	const nameRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const items = playlist.items ?? [];
	const inPlaylist = new Set(
		items.map((i) =>
			getMediaKey({ id: i.media_id, media_type: i.media_type })
		)
	);
	const isSearchMode = mode === 'edit' && query.trim().length >= 2;
	const hasAnyPending = pendingAdd !== null || pendingRemove !== null;
	const metaChanged =
		editName.trim() !== playlist.name ||
		(editDesc.trim() || null) !== playlist.description;

	useEffect(() => {
		if (open && mode === 'edit') inputRef.current?.focus();
	}, [open, mode]);

	const handleSaveMeta = async () => {
		if (!editName.trim() || !metaChanged || isSavingMeta) return;
		setIsSavingMeta(true);
		try {
			await updatePlaylist(
				playlist.id,
				editName.trim(),
				editDesc.trim() || null
			);
			onUpdateMeta?.(editName.trim(), editDesc.trim() || null);
		} catch {
			toast.error(t.profile.errorSavePlaylistMeta);
		} finally {
			setIsSavingMeta(false);
		}
	};

	const handleSaveVisibility = async (v: PrivacyVisibility) => {
		const prev = currentVisibility;
		setCurrentVisibility(v);
		onUpdateVisibility?.(v);
		try {
			await updatePlaylistVisibility(playlist.id, v);
		} catch {
			setCurrentVisibility(prev);
			onUpdateVisibility?.(prev);
			toast.error(t.profile.errorSavePlaylistMeta);
		}
	};

	const handleCopyLink = () => {
		navigator.clipboard
			.writeText(`${BASE_URL}/playlist/${playlist.id}`)
			.then(() => toast.success(t.profile.linkCopied))
			.catch(() => toast.error(t.common.actionError));
	};

	const handleAdd = async (item: MediaItem) => {
		const key = getMediaKey(item);
		if (inPlaylist.has(key) || pendingAdd === key) return;
		setPendingAdd(key);
		try {
			await addToPlaylist(
				playlist.id,
				item.id,
				item.media_type,
				item.title,
				item.poster_path ?? null
			);
			onAddItem({
				id: crypto.randomUUID(),
				playlist_id: playlist.id,
				media_id: item.id,
				media_type: item.media_type,
				media_title: item.title,
				poster_path: item.poster_path ?? null,
				added_at: new Date().toISOString(),
				release_date: item.release_date || null,
				genre_ids: item.genre_ids ?? null,
			});
			setQuery('');
		} catch {
			toast.error(t.profile.errorAdd);
		} finally {
			setPendingAdd(null);
		}
	};

	const handleRemove = async (item: PlaylistItem) => {
		const key = getMediaKey({
			id: item.media_id,
			media_type: item.media_type,
		});
		if (pendingRemove === key) return;
		setPendingRemove(key);
		try {
			await removeFromPlaylist(
				playlist.id,
				item.media_id,
				item.media_type
			);
			onRemoveItem(item.media_id, item.media_type);
		} catch {
			toast.error(t.profile.errorRemove);
		} finally {
			setPendingRemove(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-2xl h-[85dvh] flex flex-col gap-0 p-0 overflow-hidden"
				onInteractOutside={(e) => {
					if (hasAnyPending || isSavingMeta) e.preventDefault();
				}}
			>
				<div className="sr-only">
					<DialogDescription>
						{mode === 'edit'
							? t.profile.editPlaylist
							: t.profile.viewPlaylist}
					</DialogDescription>
				</div>
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
					<div
						className={cn(
							'flex items-start justify-between',
							mode === 'view' && onSwitchToEdit ? 'pr-14' : 'pr-7'
						)}
					>
						<div className="min-w-0 flex-1">
							{mode === 'edit' ? (
								<div className="space-y-1">
									<input
										ref={nameRef}
										type="text"
										value={editName}
										onChange={(e) =>
											setEditName(e.target.value)
										}
										onBlur={handleSaveMeta}
										placeholder={t.profile.playlistName}
										className="w-full text-base font-semibold text-text bg-transparent outline-none border-b border-transparent focus:border-border-subtle transition-colors placeholder:text-muted truncate"
									/>
									<input
										type="text"
										value={editDesc}
										onChange={(e) =>
											setEditDesc(e.target.value)
										}
										onBlur={handleSaveMeta}
										placeholder={
											t.profile.playlistDescription
										}
										className="w-full text-xs text-muted bg-transparent outline-none border-b border-transparent focus:border-border-subtle transition-colors placeholder:text-muted/50 truncate"
									/>
								</div>
							) : (
								<div>
									<h2 className="text-base font-semibold text-text truncate">
										{playlist.name}
									</h2>
									{playlist.description && (
										<p className="text-xs text-muted mt-0.5 truncate">
											{playlist.description}
										</p>
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
									{isSavingMeta ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<Save className="h-3.5 w-3.5" />
									)}
								</button>
							)}
							{mode === 'edit' &&
								currentVisibility === 'public' && (
									<button
										onClick={handleCopyLink}
										className="flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
										aria-label={t.profile.copyPublicLink}
									>
										<Link2 className="h-3.5 w-3.5" />
									</button>
								)}
							<span className="text-xs text-muted whitespace-nowrap">
								{items.length} {t.profile.items}
							</span>
						</div>
					</div>

					{mode === 'edit' && onUpdateVisibility && (
						<VisibilitySelector
							value={currentVisibility}
							onChange={handleSaveVisibility}
							name={`playlist-visibility-${playlist.id}`}
						/>
					)}

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
						<PlaylistSearchResults
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
	);
}
