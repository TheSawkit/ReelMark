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
          ? `linear-gradient(to right, var(--color-surface), ${color})`
          : `linear-gradient(to right, var(--color-surface), var(--color-background))`,
        transition: 'background var(--duration-base) ease-out',
      }}
      aria-hidden="true"
    />
  );
}
