'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

/** Round glass "back" control of the detail heroes: returns to wherever the viewer came from. */
export function BackButton() {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<button
			onClick={() => router.back()}
			aria-label={t.common.goBack}
			className="h-11 w-11 flex items-center justify-center rounded-full glass-overlay hover:bg-surface-2/20 shrink-0 text-text transition-colors cursor-pointer shadow-card-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
		>
			<ArrowLeft className="h-5 w-5" />
		</button>
	);
}
