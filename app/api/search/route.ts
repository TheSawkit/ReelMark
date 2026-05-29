import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';
import { rankMedia } from '@/lib/search/score';
import { getMediaKey } from '@/lib/media';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { MediaItem } from '@/types/tmdb';

const MAX_RESULTS = 6;
const MAX_USER_RESULTS = 5;
const FALLBACK_MIN_RESULTS = 3;
const FALLBACK_MIN_QUERY_LEN = 4;
const MAX_FALLBACK_QUERIES = 2;

function buildFallbackQueries(query: string): string[] {
	const candidates: string[] = [];
	const tokens = query.split(/\s+/).filter(Boolean);

	if (tokens.length > 1) {
		const longest = tokens
			.filter((t) => t.length >= FALLBACK_MIN_QUERY_LEN)
			.sort((a, b) => b.length - a.length)[0];
		if (longest) candidates.push(longest);
	}

	if (query.length >= FALLBACK_MIN_QUERY_LEN) {
		candidates.push(query.slice(0, -1));
	}

	return Array.from(new Set(candidates))
		.filter((q) => q !== query && q.length >= 2)
		.slice(0, MAX_FALLBACK_QUERIES);
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const query = searchParams.get('query')?.trim().slice(0, 200);

	if (!query || query.length < 2) {
		return NextResponse.json({ results: [] });
	}

	if (query.startsWith('@')) {
		const username = query.slice(1);
		if (!username) return NextResponse.json({ users: [] });

		const supabase = await createClient();
		const { data: profiles } = await supabase
			.from('user_profiles')
			.select('user_id, username, bio')
			.ilike('username', `%${username}%`)
			.limit(MAX_USER_RESULTS);

		if (!profiles?.length) return NextResponse.json({ users: [] });

		const adminClient = createAdminClient();
		const users = await Promise.all(
			profiles.map(async (profile) => {
				const { data } = await adminClient.auth.admin.getUserById(
					profile.user_id
				);
				const avatarUrl =
					typeof data.user?.user_metadata?.avatar_url === 'string'
						? data.user.user_metadata.avatar_url
						: null;
				return { ...profile, avatar_url: avatarUrl };
			})
		);

		return NextResponse.json({ users });
	}

	try {
		const results = await searchMulti(query);

		if (results.length < FALLBACK_MIN_RESULTS) {
			const fallbacks = buildFallbackQueries(query);
			if (fallbacks.length > 0) {
				const batches = await Promise.all(
					fallbacks.map((q) =>
						searchMulti(q).catch(() => [] as MediaItem[])
					)
				);
				const seen = new Set<string>(results.map(getMediaKey));
				for (const batch of batches) {
					for (const item of batch) {
						const key = getMediaKey(item);
						if (!seen.has(key)) {
							seen.add(key);
							results.push(item);
						}
					}
				}
			}
		}

		const ranked = rankMedia(query, results).slice(0, MAX_RESULTS);
		return NextResponse.json({ results: ranked });
	} catch (error) {
		console.error('[api/search] TMDB search failed:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch search results' },
			{ status: 500 }
		);
	}
}
