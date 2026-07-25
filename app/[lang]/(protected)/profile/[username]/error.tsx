'use client';

import { ErrorCard } from '@/components/ui/ErrorCard';

export default function ProfileError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <ErrorCard error={error} reset={reset} backHref="/dashboard" />;
}
