'use client';

import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb/images';
import type { CrewBannerProps } from '@/types/components';
import { MapPin, Calendar, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLocale } from '@/lib/i18n/utils';
import { formatDate, calculateAge } from '@/lib/format';

export function CrewBanner({ crew }: CrewBannerProps) {
	const { t, lang } = useTranslation();
	const locale = getLocale(lang);

	const age = calculateAge(crew.birthday, crew.deathday);

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

		type JobTitleObj = { male?: string; female?: string; default?: string };
		const movieTyped = t.movie as unknown as Record<string, unknown>;

		const jobTitles =
			(movieTyped.jobTitles as Record<string, JobTitleObj> | undefined) ??
			undefined;
		if (jobTitles && jobTitles[key]) {
			const isFemale = crew.gender === 1;
			const titleObj = jobTitles[key] as JobTitleObj;
			if (isFemale && titleObj.female) return titleObj.female;
			if (!isFemale && titleObj.male) return titleObj.male;
			return titleObj.default || titleObj.male || titleObj.female || dept;
		}

		const flat = movieTyped[key] as string | undefined;
		if (flat) return flat;

		return dept;
	}

	return (
		<div className="relative w-full overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-b from-primary/10 via-background to-background" />

			<div className="relative z-10 container mx-auto px-6 lg:px-12 py-12 md:py-16">
				<div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
					<div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 shrink-0 rounded-full overflow-hidden border-4 border-gold/30 shadow-cinema">
						<Image
							src={getImageUrl(crew.profile_path)}
							alt={crew.name}
							fill
							className="object-cover"
							priority
							sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
						/>
					</div>

					<div className="flex-1 text-center md:text-left">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-4">
							{crew.name}
						</h1>

						<p className="text-lg text-muted mb-6">
							{getJobLabel()}
						</p>

						<div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4">
							{crew.birthday && (
								<InfoPill>
									<Calendar className="h-4 w-4 text-muted" />
									<span className="text-sm text-text">
										{formatDate(crew.birthday, locale)}
										{age !== null &&
											` (${age} ${t.common.age})`}
									</span>
								</InfoPill>
							)}

							{crew.deathday && (
								<InfoPill>
									<Calendar className="h-4 w-4 text-red-2" />
									<span className="text-sm text-text">
										† {formatDate(crew.deathday, locale)}
									</span>
								</InfoPill>
							)}

							{crew.place_of_birth && (
								<InfoPill>
									<MapPin className="h-4 w-4 text-muted" />
									<span className="text-sm text-text">
										{crew.place_of_birth}
									</span>
								</InfoPill>
							)}

							<InfoPill>
								<Star className="h-4 w-4 fill-gold text-gold" />
								<span className="text-sm font-semibold text-text">
									{(crew.popularity || 0).toFixed(0)}
								</span>
							</InfoPill>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function InfoPill({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-2 glass-surface px-3 py-1.5 rounded-full">
			{children}
		</div>
	);
}
