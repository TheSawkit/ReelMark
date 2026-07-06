import { cn } from '@/lib/utils';

export function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'rounded-md bg-surface-2 animate-shimmer skeleton-sheen',
				className
			)}
			{...props}
		/>
	);
}
