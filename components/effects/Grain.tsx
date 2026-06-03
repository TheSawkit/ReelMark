import { cn } from '@/lib/utils';

const GRAIN_URL =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

interface GrainProps {
	opacity?: number;
	className?: string;
}

/** Subtle film-grain noise overlay, layered over gradients for cinematic texture. */
export function Grain({ opacity = 0.08, className }: GrainProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				'pointer-events-none absolute inset-0 mix-blend-overlay',
				className
			)}
			style={{
				backgroundImage: GRAIN_URL,
				backgroundSize: '120px',
				opacity,
			}}
		/>
	);
}
