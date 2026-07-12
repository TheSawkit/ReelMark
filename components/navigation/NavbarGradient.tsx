interface NavbarGradientProps {
	color?: string | null;
}

export function NavbarGradient({ color }: NavbarGradientProps) {
	return (
		<div
			className="absolute inset-x-0 top-0 pointer-events-none"
			style={{
				height: 'calc(4rem + env(safe-area-inset-top))',
				background: color
					? `linear-gradient(to right, color-mix(in srgb, var(--color-surface) 60%, transparent), color-mix(in srgb, ${color} 60%, transparent))`
					: `linear-gradient(to right, color-mix(in srgb, var(--color-surface) 60%, transparent), color-mix(in srgb, var(--color-background) 60%, transparent))`,
				transition: 'background var(--duration-base) ease-out',
			}}
			aria-hidden="true"
		/>
	);
}
