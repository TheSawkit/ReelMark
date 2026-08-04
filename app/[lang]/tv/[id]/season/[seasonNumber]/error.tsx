'use client';

import { ErrorCard, type ErrorBoundaryProps } from '@/components/ui/ErrorCard';

export default function SeasonError({ error, reset }: ErrorBoundaryProps) {
	return <ErrorCard error={error} reset={reset} backHref={null} />;
}
