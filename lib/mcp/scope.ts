import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { loadUserTaste, type UserTaste } from '@/lib/data/taste';
import { getMcpUserContext } from '@/lib/data/mcp';
import { cachedUserTaste } from '@/lib/mcp/user-cache';
import { getGenres } from '@/lib/tmdb';
import { BASE_URL } from '@/lib/metadata';
import { localizedHref } from '@/lib/i18n/utils';
import type { AssistantFormat } from '@/lib/mcp/format';
import type { McpUserContext } from '@/types/mcp';
import type { Language } from '@/lib/i18n/translations';
import type { MediaType } from '@/types/tmdb';

/** Everything the tools know about the link owner, loaded only when a tool asks for it. */
export interface UserScope {
	userId: string;
	admin: ReturnType<typeof createAdminClient>;
	taste: () => Promise<UserTaste>;
	context: () => Promise<McpUserContext>;
	format: () => Promise<AssistantFormat>;
	linkTo: (type: MediaType, id: number) => Promise<string>;
	forgetTaste: () => void;
}

const titleUrl = (lang: Language, type: MediaType, id: number) =>
	`${BASE_URL}${localizedHref(lang, `/${type}/${id}`)}`;

export function createUserScope(userId: string): UserScope {
	const admin = createAdminClient();
	const context = () => getMcpUserContext(userId);

	return {
		userId,
		admin,
		taste: () =>
			cachedUserTaste.get(userId, () => loadUserTaste(admin, userId)),
		context,
		format: async () => {
			const { lang } = await context();
			return {
				genres: await getGenres(lang),
				link: (type, id) => titleUrl(lang, type, id),
			};
		},
		linkTo: async (type, id) => titleUrl((await context()).lang, type, id),
		forgetTaste: () => cachedUserTaste.forget(userId),
	};
}
