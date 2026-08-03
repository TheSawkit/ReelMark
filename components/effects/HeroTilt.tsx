import type { ReactNode } from 'react';
import { TiltCard } from '@/components/effects/TiltCard';

// Inclinaison volontairement discrète : au-delà, la perspective déforme visiblement le titre
// incrusté dans l'image.
const HERO_TILT_MAX = 5;

/**
 * Pointer tilt of a screen's featured card, so every hero reacts identically wherever it sits.
 * No glow, which also makes the tilt's own radius inert — hence no radius to keep in sync.
 */
export function HeroTilt({ children }: { children: ReactNode }) {
	return (
		<TiltCard max={HERO_TILT_MAX} glow={false}>
			{children}
		</TiltCard>
	);
}
