'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreatePlaylistForm } from '@/components/profile/CreatePlaylistForm';
import { PlaylistCard } from '@/components/profile/PlaylistCard';
import type { Playlist, PrivacyVisibility } from '@/types/profile';

interface PlaylistsSectionProps {
	playlists: Playlist[];
	defaultVisibility?: PrivacyVisibility;
	isOwnProfile: boolean;
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
