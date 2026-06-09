'use client';

import Link from 'next/link';
import {
	Clapperboard,
	PenLine,
	Briefcase,
	Camera,
	Music,
	Scissors,
	type LucideIcon,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';
import type { CreatedBy, GroupedCrew } from '@/types/tmdb';

interface MediaCrewProps {
	crew: GroupedCrew;
	creators?: CreatedBy[];
}

interface CrewPerson {
	id: number;
	name: string;
}

function CrewRow({
	label,
	people,
	Icon,
	lang,
}: {
	label: string;
	people: CrewPerson[];
	Icon: LucideIcon;
	lang: Language;
}) {
	if (people.length === 0) return null;
	return (
		<div className="flex flex-col gap-1.5 sm:flex-row sm:gap-4">
			<dt className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted sm:w-44">
				<Icon className="h-4 w-4 text-gold/70" aria-hidden="true" />
				{label}
			</dt>
			<dd className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-text">
				{people.map((person, index) => (
					<span key={person.id}>
						<Link
							href={localizedHref(lang, `/crew/${person.id}`)}
							className="hover:text-gold transition-colors"
						>
							{person.name}
						</Link>
						{index < people.length - 1 && (
							<span className="text-muted">,</span>
						)}
					</span>
				))}
			</dd>
		</div>
	);
}

export function MediaCrew({ crew, creators }: MediaCrewProps) {
	const { t, lang } = useTranslation();

	const lead = creators?.length
		? { label: t.movie.creator, people: creators }
		: { label: t.movie.directing, people: crew.directors };

	const rows: { label: string; people: CrewPerson[]; Icon: LucideIcon }[] = [
		{ ...lead, Icon: Clapperboard },
		{ label: t.movie.writing, people: crew.writers, Icon: PenLine },
		{ label: t.movie.production, people: crew.producers, Icon: Briefcase },
		{ label: t.movie.cinematography, people: crew.dop, Icon: Camera },
		{ label: t.movie.music, people: crew.composers, Icon: Music },
		{ label: t.movie.editing, people: crew.editors, Icon: Scissors },
	];

	if (rows.every((row) => row.people.length === 0)) return null;

	return (
		<section className="space-y-6">
			<SectionHeading>{t.movie.crewTitle}</SectionHeading>
			<dl className="space-y-3">
				{rows.map((row) => (
					<CrewRow
						key={row.label}
						label={row.label}
						people={row.people}
						Icon={row.Icon}
						lang={lang}
					/>
				))}
			</dl>
		</section>
	);
}
