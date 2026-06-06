import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoBadgeProps {
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
}

/** Glass pill with an optional leading icon — shared hero/meta badge. */
export function InfoBadge({ icon, children, className }: InfoBadgeProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-2 glass-surface px-4 py-2 rounded-full shadow-card-sm',
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
				<Star className="h-5 w-5 fill-rating-gold text-rating-gold" />
			}
		>
			<span className="font-semibold text-text tabular-nums">
				{value}
			</span>
		</InfoBadge>
	);
}
