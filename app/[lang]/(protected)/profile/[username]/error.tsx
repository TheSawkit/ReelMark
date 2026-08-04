'use client';

import { ErrorCard, type ErrorBoundaryProps } from '@/components/ui/ErrorCard';

export default function ProfileError({ error, reset }: ErrorBoundaryProps) {
	return <ErrorCard error={error} reset={reset} backHref="/dashboard" />;
}
