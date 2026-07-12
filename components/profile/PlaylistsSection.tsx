'use client';

import Image from 'next/image';
import { Plus, ListVideo, Pencil, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPlaylist, deletePlaylist } from '@/app/actions/playlists';
import { getImageUrl } from '@/lib/tmdb/images';
import { cn } from '@/lib/utils';
import { VISIBILITY_ICON } from '@/lib/visibility';
import { BlurredPosterBackdrop } from '@/components/shared/BlurredPosterBackdrop';
import type {
	Playlist,
	PlaylistItem,
	PrivacyVisibility,
} from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';
import { EmptyState } from '@/components/ui/EmptyState';
import dynamic from 'next/dynamic';
import { VisibilitySelector } from '@/components/profile/VisibilitySelector';

const PlaylistEditDialog = dynamic(
	() =>
		import('@/components/profile/PlaylistEditDialog').then(
			(m) => m.PlaylistEditDialog
		),
	{ ssr: false }
);

interface PlaylistsSectionProps {
	playlists: Playlist[];
	defaultVisibility?: PrivacyVisibility;
	isOwnProfile: boolean;
}

function PlaylistCard({
	playlist,
	isOwn,
	onDelete,
	onUpdate,
}: {
	playlist: Playlist;
	isOwn: boolean;
	onDelete: (id: string) => void;
	onUpdate: (
		id: string,
		patch: Partial<
			Pick<Playlist, 'items' | 'name' | 'description' | 'visibility'>
		>
	) => void;
}) {
	const { t } = useTranslation();
	const [isPending, startTransition] = useTransition();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogKey, setDialogKey] = useState(0);
	const [dialogMode, setDialogMode] = useState<'edit' | 'view'>('view');
	const [confirmDelete, setConfirmDelete] = useState(false);
	const items = playlist.items ?? [];
	const previewItems = items.slice(0, 4);
	const backgroundPoster = items[0]?.poster_path;
	const VisIcon = VISIBILITY_ICON[playlist.visibility];

	const openViewDialog = () => {
		setDialogMode('view');
		setDialogKey((k) => k + 1);
		setDialogOpen(true);
	};

	const openEditDialog = () => {
		setDialogMode('edit');
		setDialogKey((k) => k + 1);
		setDialogOpen(true);
	};

	const switchToEditMode = () => {
		setDialogMode('edit');
	};

	const handleDelete = () => {
		startTransition(async () => {
			try {
				await deletePlaylist(playlist.id);
				onDelete(playlist.id);
			} catch {
				toast.error(t.profile.errorDelete);
				setConfirmDelete(false);
			}
		});
	};

	const handleAddItem = (item: PlaylistItem) => {
		onUpdate(playlist.id, { items: [...items, item] });
	};

	const handleRemoveItem = (mediaId: number, mediaType: 'movie' | 'tv') => {
		onUpdate(playlist.id, {
			items: items.filter(
				(i) => !(i.media_id === mediaId && i.media_type === mediaType)
			),
		});
	};

	const handleUpdateMeta = (name: string, description: string | null) => {
		onUpdate(playlist.id, { name, description });
	};

	const handleUpdateVisibility = (visibility: PrivacyVisibility) => {
		onUpdate(playlist.id, { visibility });
	};

	return (
		<>
			<div
				className="group relative min-h-44 flex flex-col overflow-hidden rounded-xl cursor-pointer bg-surface border border-border-subtle transition-transform duration-(--duration-fast) ease-apple active:scale-[0.98]"
				onClick={openViewDialog}
				role="button"
				aria-label={t.profile.viewPlaylist}
			>
				<BlurredPosterBackdrop
					posterPath={backgroundPoster}
					variant="card"
				/>

				<div className="relative z-10 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-3 sm:gap-6">
					<div className="min-w-0 sm:flex-none sm:max-w-60 flex flex-col justify-center gap-1 max-sm:pr-14">
						<h3 className="heading-display leading-none text-2xl sm:text-3xl uppercase tracking-wide text-white truncate">
							{playlist.name}
						</h3>
						{playlist.description && (
							<p className="text-sm text-white/55 line-clamp-2 leading-snug">
								{playlist.description}
							</p>
						)}
						<div className="flex items-center gap-2 mt-0.5">
							<p className="text-xs text-white/35">
								{items.length} {t.profile.items}
							</p>
							{isOwn && (
								<span className="flex items-center gap-1 text-white/30">
									<VisIcon className="h-3 w-3" />
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center shrink-0">
						{previewItems.length > 0 ? (
							<>
								{previewItems.map((item, i) => (
									<div
										key={item.id}
										className={cn(
											'relative w-14 aspect-2/3 rounded-poster overflow-hidden shrink-0',
											'border-2 border-black shadow-card',
											'transition-transform duration-(--duration-base) ease-out',
											'group-hover:-translate-y-1',
											i > 0 && '-ml-4.5'
										)}
										style={{
											zIndex: previewItems.length - i,
											transitionDelay: `${i * 30}ms`,
										}}
									>
										{item.poster_path ? (
											<Image
												src={getImageUrl(
													item.poster_path,
													'w154'
												)}
												alt={item.media_title}
												fill
												unoptimized
												sizes="56px"
												className="object-cover"
											/>
										) : (
											<div className="w-full h-full bg-surface-3 flex items-center justify-center">
												<ListVideo className="h-4 w-4 text-muted opacity-40" />
											</div>
										)}
									</div>
								))}
								{items.length > 4 && (
									<div className="relative w-14 aspect-2/3 rounded-poster bg-surface-2/70 border-2 border-black -ml-4.5 shrink-0 flex items-center justify-center z-0">
										<span className="text-xs text-white/50 font-medium">
											+{items.length - 4}
										</span>
									</div>
								)}
							</>
						) : (
							<div className="w-14 aspect-2/3 rounded-poster bg-white/5 border border-white/10 flex items-center justify-center">
								<ListVideo className="h-5 w-5 text-white/25" />
							</div>
						)}
					</div>
				</div>

				{isOwn && !confirmDelete && (
					<div className="absolute top-3 right-3 z-20 flex gap-1.5">
						<button
							onClick={(e) => {
								e.stopPropagation();
								openEditDialog();
							}}
							className="p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-glass-border text-white/55 hover:text-white hover:bg-black/70 transition-colors"
							aria-label={t.profile.editPlaylist}
						>
							<Pencil className="h-3.5 w-3.5" />
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setConfirmDelete(true);
							}}
							className="p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-glass-border text-white/55 hover:text-red hover:bg-red/20 hover:border-red/30 transition-colors"
							aria-label={t.profile.deletePlaylist}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				)}

				{confirmDelete && (
					<div
						className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-poster-overlay-heavy backdrop-blur-sm rounded-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<p className="text-sm text-white/90 font-medium">
							{t.profile.deletePlaylistConfirm}
						</p>
						<div className="flex gap-2">
							<button
								onClick={handleDelete}
								disabled={isPending}
								className="px-4 py-1.5 rounded-lg bg-red/20 border border-red/40 text-red text-sm font-medium hover:bg-red/30 transition-colors disabled:opacity-50"
							>
								{t.profile.deleteConfirm}
							</button>
							<button
								onClick={() => setConfirmDelete(false)}
								className="px-4 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-white/70 text-sm hover:bg-glass-bg-hover transition-colors"
							>
								{t.common.cancel}
							</button>
						</div>
					</div>
				)}
			</div>

			<PlaylistEditDialog
				key={dialogKey}
				playlist={playlist}
				mode={dialogMode}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onAddItem={handleAddItem}
				onRemoveItem={handleRemoveItem}
				onUpdateMeta={isOwn ? handleUpdateMeta : undefined}
				onUpdateVisibility={isOwn ? handleUpdateVisibility : undefined}
				onSwitchToEdit={isOwn ? switchToEditMode : undefined}
			/>
		</>
	);
}

function CreatePlaylistForm({
	onCreate,
	defaultVisibility,
}: {
	onCreate: (p: Playlist) => void;
	defaultVisibility: PrivacyVisibility;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [visibility, setVisibility] =
		useState<PrivacyVisibility>(defaultVisibility);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		startTransition(async () => {
			await createPlaylist(
				name.trim(),
				description.trim() || null,
				visibility
			);
			onCreate({
				id: crypto.randomUUID(),
				user_id: '',
				name: name.trim(),
				description: description.trim() || null,
				visibility,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				items: [],
			});
			setName('');
			setDescription('');
			setVisibility(defaultVisibility);
			setOpen(false);
		});
	};

	if (!open) {
		return (
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
				className="gap-2"
			>
				<Plus className="h-4 w-4" />
				{t.profile.newPlaylist}
			</Button>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="p-3 rounded-lg bg-surface border border-border-subtle shadow-card-sm space-y-2"
		>
			<Input
				placeholder={t.profile.playlistName}
				value={name}
				onChange={(e) => setName(e.target.value)}
				autoFocus
				required
			/>
			<Input
				placeholder={t.profile.playlistDescription}
				value={description}
				onChange={(e) => setDescription(e.target.value)}
			/>
			<VisibilitySelector
				value={visibility}
				onChange={setVisibility}
				name="new-playlist-visibility"
			/>
			<div className="flex gap-2">
				<Button
					type="submit"
					size="sm"
					disabled={isPending || !name.trim()}
				>
					{t.profile.createPlaylist}
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setOpen(false)}
				>
					{t.common.cancel}
				</Button>
			</div>
		</form>
	);
}

export function PlaylistsSection({
	playlists: initial,
	defaultVisibility = 'private',
	isOwnProfile,
}: PlaylistsSectionProps) {
	const { t } = useTranslation();
	const [playlists, setPlaylists] = useState(initial);

	const handleDelete = (id: string) => {
		setPlaylists((prev) => prev.filter((p) => p.id !== id));
	};

	const handleUpdate = (
		id: string,
		patch: Partial<
			Pick<Playlist, 'items' | 'name' | 'description' | 'visibility'>
		>
	) => {
		setPlaylists((prev) =>
			prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
		);
	};

	return (
		<div className="space-y-3">
			{isOwnProfile && (
				<CreatePlaylistForm
					onCreate={(p) => setPlaylists((prev) => [p, ...prev])}
					defaultVisibility={defaultVisibility}
				/>
			)}
			{playlists.length === 0 && (
				<EmptyState message={t.profile.noPlaylists} />
			)}
			{playlists.map((playlist) => (
				<PlaylistCard
					key={playlist.id}
					playlist={playlist}
					isOwn={isOwnProfile}
					onDelete={handleDelete}
					onUpdate={handleUpdate}
				/>
			))}
		</div>
	);
}
