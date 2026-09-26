'use client';

import { getImageUrl } from '@/lib/tmdb/images';
import type { CrewBannerProps } from '@/types/components';
import { MapPin, Calendar, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLocale } from '@/lib/i18n/utils';
import { formatDate } from '@/lib/format';
import { useAge } from '@/hooks/useAge';
import { InfoBadge } from '@/components/ui/InfoBadge';
import { DetailHero } from '@/components/media/detail/DetailHero';
import { BackButton } from '@/components/media/detail/BackButton';

export function CrewBanner({ crew, backdropPath }: CrewBannerProps) {
	const { t, lang } = useTranslation();
	const locale = getLocale(lang);

	const age = useAge(crew.birthday, crew.deathday);

	const DEPARTMENT_KEY_MAP: Record<string, string> = {
		Acting: 'acting',
		Directing: 'directing',
		Production: 'production',
		Writing: 'writing',
		Cinematography: 'cinematography',
		Music: 'music',
		Editing: 'editing',
		Camera: 'camera',
		Sound: 'sound',
		Art: 'art',
		'Visual Effects': 'visualEffects',
		'Costume & Make-Up': 'costumeMakeUp',
		Lighting: 'lighting',
	};

	function getJobLabel() {
		const dept = crew.known_for_department;
		if (!dept) return '';
		const key =
			DEPARTMENT_KEY_MAP[dept] ||
			dept.toLowerCase().replace(/[^a-z0-9]+/gi, '');

		type JobTitle = { male?: string; female?: string; default?: string };
		const jobTitles: Record<string, JobTitle | undefined> =
			t.movie.jobTitles;
		const title = jobTitles[key];
		if (title) {
			const gendered = crew.gender === 1 ? title.female : title.male;
			return (
				gendered || title.default || title.male || title.female || dept
			);
		}

		const flatSection: Record<string, unknown> = t.movie;
		const flat = flatSection[key];
		return typeof flat === 'string' ? flat : dept;
	}

	return (
		<DetailHero
			title={crew.name}
			backdropUrl={getImageUrl(
				backdropPath ?? crew.profile_path,
				'w1280'
			)}
			posterPath={crew.profile_path}
			backControl={<BackButton />}
			eyebrow={
				<span className="text-xs font-bold uppercase tracking-wide text-gold">
					{getJobLabel()}
				</span>
			}
			meta={
				<>
					{crew.birthday && (
						<InfoBadge
							icon={<Calendar className="h-4 w-4 text-muted" />}
						>
							{formatDate(crew.birthday, locale)}
							{age !== null && ` (${age} ${t.common.age})`}
						</InfoBadge>
					)}
					{crew.deathday && (
						<InfoBadge
							icon={<Calendar className="h-4 w-4 text-red-2" />}
						>
							† {formatDate(crew.deathday, locale)}
						</InfoBadge>
					)}
					{crew.place_of_birth && (
						<InfoBadge
							icon={<MapPin className="h-4 w-4 text-muted" />}
						>
							{crew.place_of_birth}
						</InfoBadge>
					)}
					<InfoBadge
						icon={<Star className="h-4 w-4 fill-gold text-gold" />}
					>
						<span className="font-semibold">
							{(crew.popularity || 0).toFixed(0)}
						</span>
					</InfoBadge>
				</>
			}
		/>
	);
}
