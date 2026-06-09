import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY
);
const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;

async function totalEpisodes(id) {
	const res = await fetch(`https://api.themoviedb.org/3/tv/${id}`, {
		headers: { Authorization: `Bearer ${TOKEN}` },
	});
	if (!res.ok) return null;
	const d = await res.json();
	return (d.seasons ?? [])
		.filter((s) => s.season_number > 0)
		.reduce((a, s) => a + s.episode_count, 0);
}

const { data: rows, error } = await supabase
	.from('watchlist')
	.select('media_id')
	.eq('media_type', 'tv')
	.is('total_episodes', null);
if (error) throw error;

const ids = [...new Set(rows.map((r) => r.media_id))];
console.log(`Backfilling ${ids.length} distinct TV shows...`);

let updated = 0;
let failed = 0;
for (let i = 0; i < ids.length; i += 8) {
	const batch = ids.slice(i, i + 8);
	const totals = await Promise.all(
		batch.map(async (id) => [id, await totalEpisodes(id)])
	);
	for (const [id, total] of totals) {
		if (!total) {
			failed++;
			continue;
		}
		const { error: upErr } = await supabase
			.from('watchlist')
			.update({ total_episodes: total })
			.eq('media_type', 'tv')
			.eq('media_id', id);
		if (upErr) {
			failed++;
		} else {
			updated++;
		}
	}
	process.stdout.write(`\r${Math.min(i + 8, ids.length)}/${ids.length}`);
}
console.log(`\nDone. shows updated=${updated} failed=${failed}`);
