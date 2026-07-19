'use client';

import { ErrorCard } from '@/components/ui/ErrorCard';

export default function SimilarMoviesError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <ErrorCard reset={reset} />;
}
