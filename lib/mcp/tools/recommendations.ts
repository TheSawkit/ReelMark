import 'server-only';

import { z } from 'zod';
import { tasteOfType } from '@/lib/data/taste';
import {
	pickSeeds,
	rankSuggestions,
	type SeedCandidates,
} from '@/lib/recommendations';
import { fetchSeedCandidates } from '@/lib/recommendations/candidates';
import { toAssistantTitle } from '@/lib/mcp/format';
import {
	json,
	mediaTypeSchema,
	READ_ONLY,
	type RegisterTools,
} from '@/lib/mcp/tools/shared';
import type { MediaItem } from '@/types/tmdb';

const MAX_CANDIDATE_PAGES = 3;

export const registerRecommendationTools: RegisterTools = (server, scope) => {
	server.registerTool(
		'get_recommendations',
		{
			title: 'Personal recommendations',
			description:
				'Titles ReelMark\'s engine recommends for this user, best first, built from what they watch and rate. Excludes everything already in their library or dismissed. Each item may say which title it is "because" of.',
			inputSchema: z.object({
				type: mediaTypeSchema,
				limit: z.number().int().min(1).max(20).default(10),
			}),
			annotations: READ_ONLY,
		},
		async ({ type, limit }) => {
			const [taste, format, { lang }] = await Promise.all([
				scope.taste(),
				scope.format(),
				scope.context(),
			]);
			const { entries, dismissals } = tasteOfType(taste, type);
			const seeds = pickSeeds(entries, taste.profile);
			if (seeds.length === 0) return json([]);

			const candidates: SeedCandidates[] = [];
			let ranked: MediaItem[] = [];
			for (
				let page = 1;
				page <= MAX_CANDIDATE_PAGES && ranked.length < limit;
				page++
			) {
				candidates.push(
					...(await fetchSeedCandidates(type, seeds, lang, page))
				);
				ranked = rankSuggestions(
					entries,
					taste.profile,
					dismissals,
					candidates
				);
			}
			return json(
				ranked
					.slice(0, limit)
					.map((item) => toAssistantTitle(item, format))
			);
		}
	);
};
