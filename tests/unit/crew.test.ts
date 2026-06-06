import { describe, it, expect } from 'vitest';
import { groupCrew } from '@/lib/crew';
import type { Crew } from '@/types/tmdb';

function crewMember(
	partial: Partial<Crew> & { id: number; job: string }
): Crew {
	return {
		name: `Person ${partial.id}`,
		department: 'Production',
		profile_path: null,
		...partial,
	};
}

describe('groupCrew', () => {
	it('groups people by display role', () => {
		const grouped = groupCrew([
			crewMember({ id: 1, job: 'Director' }),
			crewMember({ id: 2, job: 'Screenplay' }),
			crewMember({ id: 3, job: 'Producer' }),
			crewMember({ id: 4, job: 'Director of Photography' }),
			crewMember({ id: 5, job: 'Original Music Composer' }),
			crewMember({ id: 6, job: 'Editor' }),
		]);
		expect(grouped.directors.map((p) => p.id)).toEqual([1]);
		expect(grouped.writers.map((p) => p.id)).toEqual([2]);
		expect(grouped.producers.map((p) => p.id)).toEqual([3]);
		expect(grouped.dop.map((p) => p.id)).toEqual([4]);
		expect(grouped.composers.map((p) => p.id)).toEqual([5]);
		expect(grouped.editors.map((p) => p.id)).toEqual([6]);
	});

	it('treats Writer and Story as writers', () => {
		const grouped = groupCrew([
			crewMember({ id: 1, job: 'Writer' }),
			crewMember({ id: 2, job: 'Story' }),
		]);
		expect(grouped.writers.map((p) => p.id)).toEqual([1, 2]);
	});

	it('deduplicates a person credited several times in one role', () => {
		const grouped = groupCrew([
			crewMember({ id: 1, job: 'Writer' }),
			crewMember({ id: 1, job: 'Screenplay' }),
		]);
		expect(grouped.writers).toHaveLength(1);
	});

	it('ignores unknown jobs', () => {
		const grouped = groupCrew([crewMember({ id: 1, job: 'Sound' })]);
		expect(grouped.directors).toHaveLength(0);
		expect(grouped.writers).toHaveLength(0);
		expect(grouped.producers).toHaveLength(0);
	});
});
