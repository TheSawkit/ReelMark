'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { updatePrivacySettings } from '@/app/actions/profile';
import type {
	PrivacySettings,
	PrivacyVisibility,
	PrivacyDefaults,
} from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const initialState = { error: undefined, success: false, message: '' };

interface PrivacyRowProps {
	label: string;
	name: string;
	defaultValue: PrivacyVisibility;
}

function PrivacyRow({ label, name, defaultValue }: PrivacyRowProps) {
	const { t } = useTranslation();

	const options: Array<{
		value: PrivacyVisibility;
		label: string;
		desc: string;
	}> = [
		{
			value: 'public',
			label: t.settings.privacy.public,
			desc: t.settings.privacy.publicDesc,
		},
		{
			value: 'friends',
			label: t.settings.privacy.friendsOnly,
			desc: t.settings.privacy.friendsOnlyDesc,
		},
		{
			value: 'private',
			label: t.settings.privacy.private,
			desc: t.settings.privacy.privateDesc,
		},
	];

	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-border-subtle last:border-0">
			<span className="text-sm font-medium text-text w-40 shrink-0">
				{label}
			</span>
			<div className="flex gap-2 flex-wrap">
				{options.map((opt) => (
					<label key={opt.value} className="cursor-pointer">
						<input
							type="radio"
							name={name}
							value={opt.value}
							defaultChecked={defaultValue === opt.value}
							className="sr-only peer"
						/>
						<span
							className={cn(
								'flex flex-col px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer',
								'border-border-subtle bg-surface-2 text-muted',
								'peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-text',
								'hover:bg-surface'
							)}
						>
							<span className="font-medium">{opt.label}</span>
							<span className="opacity-60 text-[11px] mt-0.5">
								{opt.desc}
							</span>
						</span>
					</label>
				))}
			</div>
		</div>
	);
}

interface PrivacySettingsProps {
	settings: PrivacySettings | null;
}

export function PrivacySettings({ settings }: PrivacySettingsProps) {
	const { t } = useTranslation();
	const [state, formAction, isPending] = useActionState(
		updatePrivacySettings,
		initialState
	);

	const defaults: PrivacyDefaults = settings ?? {
		watchlist_visibility: 'public',
		watched_visibility: 'public',
		reviews_visibility: 'public',
		playlists_visibility: 'public',
		friends_visibility: 'public',
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.settings.privacy.title}</CardTitle>
				<CardDescription>
					{t.settings.privacy.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={formAction} className="space-y-4">
					<div>
						<PrivacyRow
							label={t.settings.privacy.watchlist}
							name="watchlist_visibility"
							defaultValue={defaults.watchlist_visibility}
						/>
						<PrivacyRow
							label={t.settings.privacy.watched}
							name="watched_visibility"
							defaultValue={defaults.watched_visibility}
						/>
						<PrivacyRow
							label={t.settings.privacy.reviews}
							name="reviews_visibility"
							defaultValue={defaults.reviews_visibility}
						/>
						<PrivacyRow
							label={t.settings.privacy.playlists}
							name="playlists_visibility"
							defaultValue={defaults.playlists_visibility}
						/>
						<PrivacyRow
							label={t.settings.privacy.friends}
							name="friends_visibility"
							defaultValue={defaults.friends_visibility}
						/>
					</div>

					{state.error && (
						<p role="alert" className="text-sm text-red">
							{state.error}
						</p>
					)}
					{state.success && (
						<p role="status" className="text-sm text-gold">
							{state.message}
						</p>
					)}

					<Button type="submit" disabled={isPending}>
						{isPending
							? t.common.updating
							: t.settings.privacy.save}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
