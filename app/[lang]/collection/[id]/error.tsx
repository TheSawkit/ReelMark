'use client';

import { ErrorCard } from '@/components/ui/ErrorCard';

export default function CollectionError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <ErrorCard reset={reset} />;
}
