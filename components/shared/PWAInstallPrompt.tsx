'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Share, SquarePlus, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTranslation } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
	const { visible, isIOS, dismiss, triggerInstall } = usePWAInstall();
	const { t } = useTranslation();
	const [installing, setInstalling] = useState(false);

	async function handleInstall() {
		setInstalling(true);
		await triggerInstall();
		setInstalling(false);
	}

	return (
		<div
			role="dialog"
			aria-label={t.pwa.title}
			aria-modal="true"
			className={cn(
				'fixed left-0 right-0 z-40',
				'top-[calc(4rem+env(safe-area-inset-top))]',
				'transition-transform duration-(--duration-slow) ease-apple',
				visible
					? 'translate-y-0'
					: 'translate-y-[-200%] pointer-events-none'
			)}
		>
			<div className="mx-auto max-w-lg glass-bar border-b border-border/60 px-4 py-3 flex items-center gap-3">
				<Image
					src="/maskable_icon_x96.png"
					alt="ReelMark"
					width={44}
					height={44}
					className="rounded-(--radius-app-icon) shrink-0"
				/>

				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-text leading-tight">
						ReelMark
					</p>
					{isIOS ? (
						<div className="flex items-center gap-1.5 mt-1 flex-wrap">
							<span className="inline-flex items-center gap-1 bg-surface-2 border border-border-subtle rounded-md px-1.5 py-0.5 text-xs text-text shrink-0">
								<Share className="size-3" aria-hidden />
								{t.pwa.iosShare}
							</span>
							<span className="text-xs text-muted">
								{t.pwa.iosThen}
							</span>
							<span className="inline-flex items-center gap-1 bg-surface-2 border border-border-subtle rounded-md px-1.5 py-0.5 text-xs text-text shrink-0">
								<SquarePlus className="size-3" aria-hidden />
								{t.pwa.iosAdd}
							</span>
						</div>
					) : (
						<p className="text-xs text-muted truncate mt-0.5">
							{t.pwa.description}
						</p>
					)}
				</div>

				{!isIOS && (
					<Button
						size="sm"
						variant="outline"
						className="rounded-full border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary hover:scale-100 shrink-0"
						loading={installing}
						onClick={handleInstall}
					>
						{t.pwa.install}
					</Button>
				)}

				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={t.pwa.dismiss}
					onClick={dismiss}
					className="shrink-0 text-muted"
				>
					<X className="size-4" aria-hidden />
				</Button>
			</div>
		</div>
	);
}
