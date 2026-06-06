'use client';

import { useState } from 'react';
import {
    Users,
    Clapperboard,
    PenLine,
    Briefcase,
    Camera,
    Music,
    Scissors,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfiniteScrollMedia } from '@/components/media/card/InfiniteScrollMedia';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useTranslation } from '@/lib/i18n/context';
import type { CrewFilmographyProps } from '@/types/components';
import type { FilmographyTabKey } from '@/lib/filmography';

const TAB_ICON: Record<FilmographyTabKey, LucideIcon> = {
    acting: Users,
    directing: Clapperboard,
    writing: PenLine,
    production: Briefcase,
    camera: Camera,
    sound: Music,
    editing: Scissors,
};

export function CrewFilmography({ departments }: CrewFilmographyProps) {
    const { t } = useTranslation();
    const [activeKey, setActiveKey] = useState<FilmographyTabKey>(departments[0]?.key ?? 'acting');

    if (departments.length === 0) return null;

    const labels: Record<FilmographyTabKey, string> = {
        acting: t.movie.cast,
        directing: t.movie.directing,
        writing: t.movie.writing,
        production: t.movie.production,
        camera: t.movie.cinematography,
        sound: t.movie.music,
        editing: t.movie.editing,
    };

    const current = departments.find((department) => department.key === activeKey) ?? departments[0];

    return (
        <section className="space-y-6">
            <SectionHeading>{t.movie.filmography}</SectionHeading>

            {departments.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {departments.map((department) => {
                        const Icon = TAB_ICON[department.key];
                        return (
                            <TabButton
                                key={department.key}
                                active={department.key === current.key}
                                onClick={() => setActiveKey(department.key)}
                                icon={<Icon className="h-4 w-4" />}
                                label={`${labels[department.key]} (${department.items.length})`}
                            />
                        );
                    })}
                </div>
            )}

            <InfiniteScrollMedia key={current.key} initialItems={current.items.slice(0, 20)} category={current.key} clientSideData={current.items} />
        </section>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }) {
    return (
        <Button
            variant={active ? 'default' : 'outline'}
            className={`gap-2 cursor-pointer ${
                active
                    ? 'bg-primary hover:bg-primary-hover text-white border-none'
                    : 'bg-surface-2 text-muted hover:text-text hover:bg-surface border-border/20'
            }`}
            onClick={onClick}
        >
            {icon}
            {label}
        </Button>
    );
}
