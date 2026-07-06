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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { updateSocialLinks } from '@/app/actions/profile';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';

const initialState = { error: undefined, success: false, message: '' };

interface SocialLinksSettingsProps {
	profile: UserProfile | null;
}

export function SocialLinksSettings({ profile }: SocialLinksSettingsProps) {
	const { t } = useTranslation();
	const [state, formAction, isPending] = useActionState(
		updateSocialLinks,
		initialState
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.settings.social.title}</CardTitle>
				<CardDescription>
					{t.settings.social.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={formAction} className="space-y-4">
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="bio">
								{t.settings.social.bio}
							</FieldLabel>
							<Textarea
								id="bio"
								name="bio"
								rows={3}
								defaultValue={profile?.bio ?? ''}
								placeholder={t.settings.social.bioPlaceholder}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="instagram">
								{t.settings.social.instagram}
							</FieldLabel>
							<div className="flex items-center">
								<InputPrefix>instagram.com/</InputPrefix>
								<Input
									id="instagram"
									name="instagram"
									defaultValue={profile?.instagram ?? ''}
									placeholder={
										t.settings.social.usernamePlaceholder
									}
									className="rounded-l-none"
								/>
							</div>
						</Field>

						<Field>
							<FieldLabel htmlFor="tiktok">
								{t.settings.social.tiktok}
							</FieldLabel>
							<div className="flex items-center">
								<InputPrefix>tiktok.com/@</InputPrefix>
								<Input
									id="tiktok"
									name="tiktok"
									defaultValue={profile?.tiktok ?? ''}
									placeholder={
										t.settings.social.usernamePlaceholder
									}
									className="rounded-l-none"
								/>
							</div>
						</Field>

						<Field>
							<FieldLabel htmlFor="letterboxd">
								{t.settings.social.letterboxd}
							</FieldLabel>
							<div className="flex items-center">
								<InputPrefix>letterboxd.com/</InputPrefix>
								<Input
									id="letterboxd"
									name="letterboxd"
									defaultValue={profile?.letterboxd ?? ''}
									placeholder={
										t.settings.social.usernamePlaceholder
									}
									className="rounded-l-none"
								/>
							</div>
						</Field>

						<Field>
							<FieldLabel htmlFor="twitter">
								{t.settings.social.twitter}
							</FieldLabel>
							<div className="flex items-center">
								<InputPrefix>x.com/</InputPrefix>
								<Input
									id="twitter"
									name="twitter"
									defaultValue={profile?.twitter ?? ''}
									placeholder={
										t.settings.social.usernamePlaceholder
									}
									className="rounded-l-none"
								/>
							</div>
						</Field>

						<Field>
							<FieldLabel htmlFor="website">
								{t.settings.social.website}
							</FieldLabel>
							<Input
								id="website"
								name="website"
								type="url"
								defaultValue={profile?.website ?? ''}
								placeholder={t.settings.social.urlPlaceholder}
							/>
						</Field>
					</FieldGroup>

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
						{isPending ? t.common.updating : t.settings.social.save}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function InputPrefix({ children }: { children: React.ReactNode }) {
	return (
		<span className="px-3 py-2 text-sm text-muted bg-surface-2 border border-r-0 border-border rounded-l-md">
			{children}
		</span>
	);
}
