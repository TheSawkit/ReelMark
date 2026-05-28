'use client';

import { useTranslation } from '@/lib/i18n/context';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { MediaDescriptionProps } from '@/types/components';

/** Displays media overview text with section heading, or a placeholder if unavailable. */
export function MediaDescription({ description }: MediaDescriptionProps) {
	const { t } = useTranslation();

	return (
		<section className="space-y-6">
			<SectionHeading>{t.movie.description}</SectionHeading>
			{description ? (
				<p className="text-lg text-muted leading-relaxed max-w-4xl">
					{description}
				</p>
			) : (
				<p className="text-lg text-muted italic">
					{t.movie.noDescription}
				</p>
			)}
		</section>
	);
}
