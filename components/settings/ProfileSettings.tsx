'use client';

import Image from 'next/image';
import { useActionState, useState, useRef, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { updateProfile, updateAvatar } from '@/app/settings/actions';
import { Upload } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useTranslation } from '@/lib/i18n/context';

const initialState = {
	error: undefined,
	success: false,
	message: '',
};

interface ProfileSettingsProps {
	user: User | null;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
	const { t } = useTranslation();
	const [state, formAction, isPending] = useActionState(
		updateProfile,
		initialState
	);
	const [avatarState, avatarFormAction, isAvatarPending] = useActionState(
		updateAvatar,
		initialState
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState(
		user?.user_metadata?.avatar_url || ''
	);
	const [fullNameStr, setFullNameStr] = useState(
		user?.user_metadata?.full_name || ''
	);
	const [usernameStr, setUsernameStr] = useState(
		user?.user_metadata?.username || ''
	);
	const [prevUser, setPrevUser] = useState(user);

	if (user !== prevUser) {
		setPrevUser(user);
		setFullNameStr(user?.user_metadata?.full_name || '');
		setUsernameStr(user?.user_metadata?.username || '');
	}

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 5 * 1024 * 1024) {
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			setAvatarPreview(reader.result as string);
			setAvatarFile(file);
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t.settings.profile.title}</CardTitle>
					<CardDescription>
						{t.settings.profile.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction} className="space-y-6">
						<FieldGroup>
							<Field>
								<FieldLabel id="avatar-label">
									{t.settings.profile.avatar}
								</FieldLabel>
								<div className="flex items-start gap-6 mt-4">
									<div className="relative">
										{avatarPreview ? (
											<Image
												src={avatarPreview}
												alt={t.common.userAvatar}
												width={80}
												height={80}
												className="rounded-full object-cover border-2 border-border"
												unoptimized
											/>
										) : (
											<div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center border-2 border-border">
												<span className="text-sm font-medium text-muted">
													{user?.user_metadata?.username?.[0]?.toUpperCase() ||
														user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
														t.common.user[0]}
												</span>
											</div>
										)}
									</div>
									<div className="flex-1 space-y-3">
										<input
											ref={fileInputRef}
											id="avatar-input"
											type="file"
											accept="image/*"
											onChange={handleAvatarChange}
											className="sr-only"
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											aria-labelledby="avatar-label"
											onClick={() =>
												fileInputRef.current?.click()
											}
											className="gap-2"
										>
											<Upload className="h-4 w-4" />
											{avatarFile
												? avatarFile.name
												: t.settings.profile.avatar}
										</Button>
										<FieldDescription>
											{t.settings.profile.formatAvatar}
										</FieldDescription>
										{avatarPreview &&
											avatarPreview !==
												user?.user_metadata
													?.avatar_url && (
												<>
													<Button
														type="button"
														size="sm"
														onClick={() => {
															const formData =
																new FormData();
															if (avatarFile) {
																formData.set(
																	'avatarFile',
																	avatarFile
																);
															} else {
																formData.set(
																	'avatarUrl',
																	avatarPreview
																);
															}
															startTransition(
																() => {
																	avatarFormAction(
																		formData
																	);
																}
															);
														}}
														disabled={
															isAvatarPending
														}
													>
														{isAvatarPending
															? t.common.updating
															: t.settings.profile
																	.updateAvatar}
													</Button>
													{avatarState.error && (
														<p
															role="alert"
															className="text-sm text-red"
														>
															{avatarState.error}
														</p>
													)}
													{avatarState.success && (
														<p
															role="status"
															className="text-sm text-gold"
														>
															{
																avatarState.message
															}
														</p>
													)}
												</>
											)}
									</div>
								</div>
							</Field>

							<Field>
								<FieldLabel htmlFor="fullName">
									{t.settings.profile.fullName}
								</FieldLabel>
								<Input
									id="fullName"
									name="fullName"
									type="text"
									value={fullNameStr}
									onChange={(e) =>
										setFullNameStr(e.target.value)
									}
									placeholder={`${t.settings.profile.placeholder}${t.settings.profile.fullName.toLowerCase()}`}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="username">
									{t.settings.profile.username} *
								</FieldLabel>
								<Input
									id="username"
									name="username"
									type="text"
									required
									value={usernameStr}
									onChange={(e) =>
										setUsernameStr(e.target.value)
									}
									placeholder={`${t.settings.profile.placeholder}${t.settings.profile.username.toLowerCase()}`}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="email">
									{t.settings.profile.email}
								</FieldLabel>
								<Input
									id="email"
									name="email"
									type="email"
									defaultValue={user?.email || ''}
									disabled
									className="opacity-50"
								/>
								<FieldDescription>
									{t.settings.profile.warningEmail}
								</FieldDescription>
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
							{isPending
								? t.common.updating
								: t.settings.profile.updateProfile}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
