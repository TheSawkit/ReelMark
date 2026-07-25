'use client';

import { Share, SquarePlus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

/** The two-step Safari gesture, the only way to install a PWA on iOS. */
export function IosInstallHint() {
	const { t } = useTranslation();

	return (
		<span className="flex flex-wrap items-center gap-1.5">
			<span>{t.pwa.iosSafariOnly}</span>
			<span className="inline-flex shrink-0 items-center gap-1 rounded-(--radius-md) border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-text">
				<Share className="size-3" aria-hidden />
				{t.pwa.iosShare}
			</span>
			<span>{t.pwa.iosThen}</span>
			<span className="inline-flex shrink-0 items-center gap-1 rounded-(--radius-md) border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-text">
				<SquarePlus className="size-3" aria-hidden />
				{t.pwa.iosAdd}
			</span>
		</span>
	);
}
