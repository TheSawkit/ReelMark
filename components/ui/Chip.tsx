import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
	children: ReactNode;
	active?: boolean;
	onClick?: () => void;
	icon?: ReactNode;
	className?: string;
}

/** Rounded glass pill for genres, filters and tags; inverts colors when active. */
export function Chip({
	children,
	active = false,
	onClick,
	icon,
	className,
}: ChipProps) {
	const classes = cn(
		'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-(--duration-fast) ease-apple',
		active
			? 'border border-transparent bg-text text-background'
			: 'glass-surface text-muted hover:text-text',
		className
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className={cn(
					'min-h-11 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
					classes
				)}
			>
				{icon}
				{children}
			</button>
		);
	}

	return (
		<span className={classes}>
			{icon}
			{children}
		</span>
	);
}
