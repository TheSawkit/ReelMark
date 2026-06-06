import { Children, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MovingRowProps {
	children: ReactNode;
	speed?: number;
	gap?: number;
	reverse?: boolean;
	className?: string;
}

/** Infinite horizontal marquee; duplicates children and pauses on hover (CSS only). */
export function MovingRow({
	children,
	speed = 40,
	gap = 12,
	reverse = false,
	className,
}: MovingRowProps) {
	const items = Children.toArray(children);
	const pass = (prefix: string) =>
		items.map((item, i) => (
			<div
				key={`${prefix}-${i}`}
				className="shrink-0"
				style={{ marginRight: gap }}
				aria-hidden={prefix === 'b' ? 'true' : undefined}
			>
				{item}
			</div>
		));

	return (
		<div
			className={cn('marquee-paused overflow-hidden', className)}
			style={{
				maskImage:
					'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
				WebkitMaskImage:
					'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
			}}
		>
			<div
				className="marquee-track flex w-max"
				style={
					{
						'--marquee-duration': `${speed}s`,
						animationDirection: reverse ? 'reverse' : 'normal',
					} as React.CSSProperties
				}
			>
				{pass('a')}
				{pass('b')}
			</div>
		</div>
	);
}
