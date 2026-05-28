'use client';

import { ErrorCard } from '@/components/ui/ErrorCard';

export default function SeasonError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <ErrorCard reset={reset} backHref={null} />;
}
