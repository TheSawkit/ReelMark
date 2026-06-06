import { cn } from '@/lib/utils';

interface AuroraProps {
	intensity?: number;
	className?: string;
}

/** Slow drifting accent/gold blobs for cinematic hero backdrops. Decorative only. */
export function Aurora({ intensity = 1, className }: AuroraProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				'pointer-events-none absolute inset-0 overflow-hidden',
				className
			)}
			style={{ opacity: intensity }}
		>
			<div
				className="absolute -left-[6%] -top-[12%] h-[58%] w-[62%] rounded-full blur-[46px] will-change-transform"
				style={{
					background:
						'radial-gradient(circle, rgb(var(--color-red-rgb)) 0%, transparent 60%)',
					animation: 'aurora-drift-a 15s ease-in-out infinite',
				}}
			/>
			<div
				className="absolute -bottom-[16%] -right-[10%] h-[62%] w-[56%] rounded-full blur-[46px] will-change-transform"
				style={{
					background:
						'radial-gradient(circle, rgb(var(--color-red-rgb) / 0.7) 0%, transparent 60%)',
					animation: 'aurora-drift-b 18s ease-in-out infinite',
				}}
			/>
			<div
				className="absolute left-[32%] top-[18%] h-[46%] w-[46%] rounded-full blur-[46px] opacity-40 will-change-transform"
				style={{
					background:
						'radial-gradient(circle, var(--gold) 0%, transparent 65%)',
					animation: 'aurora-drift-c 21s ease-in-out infinite',
				}}
			/>
		</div>
	);
}
