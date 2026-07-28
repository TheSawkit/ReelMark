'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useGuardedTransition } from '@/hooks/useGuardedTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisibilitySelector } from '@/components/profile/VisibilitySelector';
import { createPlaylist } from '@/app/actions/playlists';
import { useTranslation } from '@/lib/i18n/context';
import type { Playlist, PrivacyVisibility } from '@/types/profile';

interface CreatePlaylistFormProps {
	onCreate: (p: Playlist) => void;
	defaultVisibility: PrivacyVisibility;
}

/** Inline disclosure form creating a playlist with optimistic append. */
export function CreatePlaylistForm({
	onCreate,
	defaultVisibility,
}: CreatePlaylistFormProps) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [visibility, setVisibility] =
		useState<PrivacyVisibility>(defaultVisibility);
	const [isPending, startTransition] = useGuardedTransition();

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
