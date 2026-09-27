import 'server-only';

import { tasteOfType } from '@/lib/data/taste';
import { summarizeTaste } from '@/lib/recommendations';
import { toAssistantTaste } from '@/lib/mcp/format';
import {
	json,
	MEDIA_TYPES,
	READ_ONLY,
	type RegisterTools,
} from '@/lib/mcp/tools/shared';

export const registerTasteTools: RegisterTools = (server, scope) => {
	server.registerTool(
		'get_taste_profile',
		{
			title: 'Taste profile',
			description:
				"Summary of the user's tastes, per media type: favourite and disliked genres, average rating, best and worst rated titles, shows in progress, abandoned titles and library counts.",
			annotations: READ_ONLY,
		},
		async () => {
			const [taste, format] = await Promise.all([
				scope.taste(),
				scope.format(),
			]);
			return json(
				Object.fromEntries(
					MEDIA_TYPES.map((type) => [
						type,
						toAssistantTaste(
							summarizeTaste(
								tasteOfType(taste, type).entries,
								taste.profile
							),
							format
						),
					])
				)
			);
		}
	);
};
