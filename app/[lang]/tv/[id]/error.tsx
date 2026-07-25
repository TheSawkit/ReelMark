'use client';

import { ErrorCard } from '@/components/ui/ErrorCard';

export default function TvShowError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <ErrorCard error={error} reset={reset} />;
}
