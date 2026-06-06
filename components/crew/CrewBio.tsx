'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { CrewBioProps } from '@/types/components';
import { useTranslation } from '@/lib/i18n/context';

const BIO_PREVIEW_LENGTH = 500;

export function CrewBio({ biography }: CrewBioProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { t } = useTranslation();

    if (!biography) {
        return (
            <section className="space-y-4">
                <SectionHeading>{t.movie.biography}</SectionHeading>
                <p className="text-muted italic">{t.movie.noBiography}</p>
            </section>
        );
    }

    const shouldTruncate = biography.length > BIO_PREVIEW_LENGTH;
    const displayedText = shouldTruncate && !isExpanded ? biography.slice(0, BIO_PREVIEW_LENGTH) + '…' : biography;

    return (
        <section className="space-y-4">
            <SectionHeading>{t.movie.biography}</SectionHeading>

            <p className="text-lg text-muted leading-relaxed max-w-4xl whitespace-pre-line">{displayedText}</p>

            {shouldTruncate && (
                <Button
                    variant="ghost"
                    className="text-red-2 hover:text-red hover:bg-red/10 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? t.movie.readLess : t.movie.readMore}
                </Button>
            )}
        </section>
    );
}
