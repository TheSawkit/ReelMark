'use client';

import { type ReactNode } from 'react';
import { LanguageProvider } from '@/lib/i18n/context';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Language } from '@/lib/i18n/translations';

interface ProvidersProps {
    children: ReactNode;
    initialLang: Language;
}

export function Providers({ children, initialLang }: ProvidersProps) {
    return (
        <LanguageProvider initialLang={initialLang}>
            <TooltipProvider>{children}</TooltipProvider>
        </LanguageProvider>
    );
}
