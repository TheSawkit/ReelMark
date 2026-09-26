import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoBadgeProps {
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
}

/** Compact glass pill with an optional leading icon — one item of a hero's single-line meta row. */
export function InfoBadge({ icon, children, className }: InfoBadgeProps) {
	return (
		<div
			className={cn(
				'flex h-8 shrink-0 items-center gap-1.5 glass-surface px-3 rounded-full text-sm shadow-card-xs',
				className
			)}
		>
			{icon}
			{children}
		</div>
	);
}

/** Gold star rating pill (hero/banner scale), built on InfoBadge. */
export function RatingBadge({
	value,
	className,
}: {
	value: string | number;
	className?: string;
}) {
	return (
		<InfoBadge
			className={className}
			icon={
				<Star className="h-4 w-4 fill-rating-gold text-rating-gold" />
			}
		>
			<span className="font-semibold text-text tabular-nums">
				{value}
			</span>
		</InfoBadge>
	);
}
