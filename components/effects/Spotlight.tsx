import { cn } from '@/lib/utils';

interface SpotlightProps {
	className?: string;
}

/** Large blurred conic beam sweeping from the top, for cinematic hero sections. */
export function Spotlight({ className }: SpotlightProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				'pointer-events-none absolute -left-[10%] -top-[30%] h-[120%] w-[120%]',
				className
			)}
			style={{
				transformOrigin: '50% 0%',
				animation: 'spotlight-sweep 9s ease-in-out infinite',
			}}
		>
			<div
				className="absolute inset-0 blur-[50px]"
				style={{
					background:
						'conic-gradient(from 210deg at 50% 0%, transparent 0deg, var(--spotlight) 30deg, transparent 70deg)',
				}}
			/>
		</div>
	);
}
