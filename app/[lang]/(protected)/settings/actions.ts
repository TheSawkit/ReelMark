'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { revalidateLayoutAfterResponse } from '@/app/actions/_helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isOAuthOnly } from '@/lib/supabase/auth-helpers';
import { getTranslations, getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import {
	validatePassword,
	validateUsername,
	validateRegion,
	validateAvatarFile,
	formStr,
} from '@/lib/validators';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

async function syncUserProfile(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
	username: string,
	fullName?: string | null
): Promise<string | null> {
	const { error } = await supabase
		.from('user_profiles')
		.upsert(
			{
				user_id: userId,
				username,
				...(fullName !== undefined && { full_name: fullName }),
				updated_at: new Date().toISOString(),
			},
			{ onConflict: ON_CONFLICT.userProfiles }
		)
		.select('username');

	if (error?.code === '23505') return 'USERNAME_TAKEN';
	if (error) return error.message;
	return null;
}

export async function updatePassword(prevState: unknown, formData: FormData) {
	const supabase = await createClient();
	const t = await getTranslations();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: t.auth.notAuthenticated, success: false };
	}

	const newPassword = validatePassword(formData.get('password'));
	const confirmPassword = formData.get('confirm-password');

	if (!newPassword || !confirmPassword) {
		return { error: t.settings.missingFields, success: false };
	}

	if (newPassword !== confirmPassword) {
		return { error: t.settings.password.noMatch, success: false };
	}

	const { error } = await supabase.auth.updateUser({
		password: newPassword,
	});

	if (error) {
		return { error: error.message, success: false };
	}

	return {
		error: undefined,
		success: true,
		message: `${t.settings.password.title}${t.settings.successUpdate}`,
	};
}

export async function updateProfile(prevState: unknown, formData: FormData) {
	const supabase = await createClient();
	const t = await getTranslations();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: t.auth.notAuthenticated, success: false };
	}

	const fullName = validateUsername(formData.get('fullName'));
	const username = validateUsername(formData.get('username'));
	const region = validateRegion(formData.get('region'));

	if (!username) {
		return { error: t.settings.missingFields, success: false };
	}

	const { error } = await supabase.auth.updateUser({
		data: {
			full_name: fullName ?? null,
			name: fullName ?? username,
			username,
			region: region ?? undefined,
		},
	});

	if (error) {
		return { error: error.message, success: false };
	}

	const syncError = await syncUserProfile(
		supabase,
		user.id,
		username,
		fullName ?? null
	);
	if (syncError === 'USERNAME_TAKEN')
		return { error: t.settings.usernameTaken, success: false };
	if (syncError) return { error: syncError, success: false };

	revalidateLayoutAfterResponse();
	return {
		error: undefined,
		success: true,
		message: `${t.settings.profile.title}${t.settings.successUpdate}`,
	};
}

export async function updateAvatar(prevState: unknown, formData: FormData) {
	const supabase = await createClient();
	const t = await getTranslations();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: t.auth.notAuthenticated, success: false };
	}

	const avatarUrl = formStr(formData, 'avatarUrl');
	const avatarFile = formData.get('avatarFile') as File | null;

	if (!avatarUrl && (!avatarFile || avatarFile.size === 0)) {
		return { error: t.settings.profile.invalidAvatarUrl, success: false };
	}

	let finalAvatarUrl = avatarUrl || '';

	if (avatarFile && avatarFile.size > 0) {
		const validation = validateAvatarFile(avatarFile);
		if (!validation.valid) {
			return {
				error: t.settings.avatar[validation.errorCode],
				success: false,
			};
		}

		const fileExt = validation.ext;
		const fileName = `${user.id}-${Date.now()}.${fileExt}`;

		const buffer = await avatarFile.arrayBuffer();
		const adminClient = createAdminClient();

		const { data: currentProfile } = await supabase
			.from('user_profiles')
			.select('avatar_url')
			.eq('user_id', user.id)
			.maybeSingle();
		const oldAvatarUrl =
			currentProfile?.avatar_url ??
			(user.user_metadata?.avatar_url as string | undefined);
		if (oldAvatarUrl?.includes('/avatars/')) {
			const oldPath = oldAvatarUrl.split('/avatars/')[1]?.split('?')[0];
			if (oldPath) {
				await adminClient.storage.from('avatars').remove([oldPath]);
			}
		}

		const { error: uploadError } = await adminClient.storage
			.from('avatars')
			.upload(fileName, buffer, {
				contentType: avatarFile.type,
				upsert: true,
			});

		if (uploadError) {
			return { error: uploadError.message, success: false };
		}

		const { data: publicUrlData } = adminClient.storage
			.from('avatars')
			.getPublicUrl(fileName);
		finalAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
	}

	const username = user.user_metadata?.username as string | undefined;
	if (!username) {
		return { error: t.settings.missingFields, success: false };
	}

	const { error } = await supabase.from('user_profiles').upsert(
		{
			user_id: user.id,
			username,
			avatar_url: finalAvatarUrl,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: ON_CONFLICT.userProfiles }
	);

	if (error) {
		return { error: error.message, success: false };
	}

	revalidateLayoutAfterResponse();
	return {
		error: undefined,
		success: true,
		message: `${t.settings.profile.avatar}${t.settings.successUpdate}`,
	};
}

export async function deleteAccount(prevState: unknown, formData: FormData) {
	const supabase = await createClient();
	const t = await getTranslations();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: t.auth.notAuthenticated, success: false };
	}

	const confirmation = formData.get('confirmation');
	const password = formData.get('password');

	if (
		typeof confirmation !== 'string' ||
		confirmation !== t.danger.confirmPlaceholder
	) {
		return {
			error: t.settings.dangerZone.incorrectConfirmation,
			success: false,
		};
	}

	if (!isOAuthOnly(user)) {
		if (typeof password !== 'string' || !password) {
			return {
				error: t.settings.dangerZone.passwordRequired,
				success: false,
			};
		}

		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: user.email!,
			password,
		});

		if (signInError) {
			return {
				error: t.settings.dangerZone.incorrectPassword,
				success: false,
			};
		}
	}

	await supabase.from('episode_watches').delete().eq('user_id', user.id);
	await supabase.from('watchlist').delete().eq('user_id', user.id);
	await supabase.from('reviews').delete().eq('user_id', user.id);

	const { data: userPlaylists } = await supabase
		.from('playlists')
		.select('id')
		.eq('user_id', user.id);
	if (userPlaylists && userPlaylists.length > 0) {
		await supabase
			.from('playlist_items')
			.delete()
			.in(
				'playlist_id',
				userPlaylists.map((p) => p.id)
			);
	}
	await supabase.from('playlists').delete().eq('user_id', user.id);
	await supabase
		.from('friendships')
		.delete()
		.or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
	await supabase.from('privacy_settings').delete().eq('user_id', user.id);
	await supabase.from('user_profiles').delete().eq('user_id', user.id);

	const adminClient = createAdminClient();

	// `notifications.sender_id` est NOT NULL alors que sa FK est ON DELETE SET NULL :
	// sans cette purge, `deleteUser` échoue en 23502 dès que le compte a émis une
	// notification. Les lignes émises appartiennent à leurs destinataires, d'où l'admin client.
	await adminClient.from('notifications').delete().eq('user_id', user.id);
	await adminClient.from('notifications').delete().eq('sender_id', user.id);

	const { data: avatarFiles } = await adminClient.storage
		.from('avatars')
		.list('', {
			limit: 1000,
			search: user.id,
		});
	const userAvatarFiles = (avatarFiles ?? [])
		.filter((f) => f.name.startsWith(`${user.id}-`))
		.map((f) => f.name);
	if (userAvatarFiles.length > 0) {
		await adminClient.storage.from('avatars').remove(userAvatarFiles);
	}

	const { error: deleteError } = await adminClient.auth.admin.deleteUser(
		user.id
	);

	if (deleteError) {
		return { error: deleteError.message, success: false };
	}

	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/login?deleted=true'));
}
