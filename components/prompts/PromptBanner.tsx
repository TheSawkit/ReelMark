'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptBannerProps {
	visible: boolean;
	icon: ReactNode;
	title: string;
	description: ReactNode;
	action?: ReactNode;
	dismissLabel: string;
	onDismiss: () => void;
}

/** Single slot under the navbar where every call-to-action is rendered, one at a time. */
export function PromptBanner({
	visible,
	icon,
	title,
	description,
	action,
	dismissLabel,
	onDismiss,
}: PromptBannerProps) {
	return (
		<div
			role="region"
			aria-label={title}
			className={cn(
				'fixed left-0 right-0 z-40',
				'top-[calc(4rem+env(safe-area-inset-top))]',
				'transition-transform duration-(--duration-slow) ease-apple',
				visible
					? 'translate-y-0'
					: 'pointer-events-none translate-y-[-200%]'
			)}
		>
			<div className="mx-auto flex max-w-lg items-center gap-3 glass-bar border-b border-border/60 px-4 py-3">
				<span className="shrink-0 text-primary">{icon}</span>

				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold leading-tight text-text">
						{title}
					</p>
					<div className="mt-0.5 text-xs text-muted">
						{description}
					</div>
				</div>

				{action}

				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={dismissLabel}
					onClick={onDismiss}
					className="shrink-0 text-muted"
				>
					<X className="size-4" aria-hidden />
				</Button>
			</div>
		</div>
	);
}
