import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { reportSwallowed } from '@/lib/report';
import {
	avatarExtensionForMime,
	isImportableAvatarUrl,
	isStoredAvatarUrl,
} from '@/lib/validators';

const FETCH_TIMEOUT_MS = 5_000;
const MAX_REMOTE_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * Copies an OAuth provider avatar into the `avatars` bucket the first time a user signs in,
 * so the app stops hotlinking a third-party CDN — Google refuses requests carrying our
 * `Referer` and sees every visitor's IP. A user-uploaded avatar is never overwritten.
 * Best effort: any failure leaves the provider URL in place.
 */
export async function mirrorOAuthAvatar(
	userId: string,
	sourceUrl: unknown
): Promise<void> {
	if (!isImportableAvatarUrl(sourceUrl)) return;

	try {
		const admin = createAdminClient();
		const { data: profile } = await admin
			.from('user_profiles')
			.select('avatar_url')
			.eq('user_id', userId)
			.maybeSingle();

		if (isStoredAvatarUrl(profile?.avatar_url)) return;

		const response = await fetch(sourceUrl, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});
		if (!response.ok) {
			reportSwallowed(
				'auth:avatar-mirror',
				`provider responded ${response.status}`
			);
			return;
		}

		const extension = avatarExtensionForMime(
			response.headers.get('content-type') ?? ''
		);
		if (!extension) return;

		const body = await response.arrayBuffer();
		if (body.byteLength === 0 || body.byteLength > MAX_REMOTE_AVATAR_BYTES)
			return;

		const fileName = `${userId}-${Date.now()}.${extension}`;
		const { error: uploadError } = await admin.storage
			.from('avatars')
			.upload(fileName, body, {
				contentType: response.headers.get('content-type') ?? undefined,
				upsert: true,
			});
		if (uploadError) {
			reportSwallowed('auth:avatar-mirror', uploadError);
			return;
		}

		const { data: publicUrl } = admin.storage
			.from('avatars')
			.getPublicUrl(fileName);

		const { error: updateError } = await admin
			.from('user_profiles')
			.update({ avatar_url: publicUrl.publicUrl })
			.eq('user_id', userId);
		if (updateError) reportSwallowed('auth:avatar-mirror', updateError);
	} catch (error) {
		reportSwallowed('auth:avatar-mirror', error);
	}
}
