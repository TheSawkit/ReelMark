import Link from 'next/link';
import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
	message: string;
	action?: { href: string; label: string };
	icon?: LucideIcon;
	className?: string;
}

/** Centered glass empty-state card with an icon, message and optional action. */
export function EmptyState({
	message,
	action,
	icon: Icon = Inbox,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-4 glass-surface rounded-(--radius-xl) shadow-cinema px-6 py-14 text-center',
				className
			)}
			style={{
				animation:
					'scaleIn var(--duration-slow) var(--ease-apple) both',
			}}
		>
			<div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
				<Icon className="h-7 w-7" />
			</div>
			<p className="text-sm font-medium text-muted">{message}</p>
			{action && (
				<Button asChild size="sm">
					<Link href={action.href}>{action.label}</Link>
				</Button>
			)}
		</div>
	);
}
