interface CinemaSpotlightProps {
  height?: number;
  maxWidth?: number | string;
  intensity?: number;
  position?: string;
}

export default function CinemaSpotlight({
  height = 600,
  maxWidth,
  intensity = 0.35,
  position = 'top-0',
}: CinemaSpotlightProps) {
  const maxWidthValue = maxWidth
    ? typeof maxWidth === 'number'
      ? `${maxWidth}px`
      : maxWidth
    : '100%';

  const r = 'var(--color-red-rgb)';

  return (
    <div
      className={`absolute ${position} inset-x-0 pointer-events-none -z-10`}
      style={{
        height: `${height}px`,
        maxWidth: maxWidthValue,
        margin: '0 auto',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(ellipse 60% 45% at 50% 0%, rgb(${r} / ${intensity}) 0%, transparent 70%)`,
            `radial-gradient(ellipse 90% 30% at 50% 0%, rgb(${r} / ${intensity * 0.3}) 0%, transparent 60%)`,
          ].join(', '),
        }}
      />

      <div
        className="absolute inset-0 animate-[spotlightPulse_8s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(ellipse 40% 35% at 50% 0%, rgb(${r} / ${intensity * 0.4}) 0%, transparent 60%)`,
        }}
      />

      <div
        className="absolute inset-0 animate-[spotlightDrift_12s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(ellipse 30% 25% at 50% 5%, rgb(${r} / ${intensity * 0.2}) 0%, transparent 50%)`,
        }}
      />

      <div
        className="absolute bottom-0 inset-x-0 h-1/3"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
        }}
      />
    </div>
  );
}
