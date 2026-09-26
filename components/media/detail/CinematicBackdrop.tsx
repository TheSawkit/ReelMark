import { Aurora } from '@/components/effects/Aurora';
import { Spotlight } from '@/components/effects/Spotlight';
import { Grain } from '@/components/effects/Grain';
import { PauseWhenOffscreen } from '@/components/effects/PauseWhenOffscreen';
import { HeroArt } from '@/components/media/detail/HeroArt';

interface CinematicBackdropProps {
	src: string;
	posterPath: string | null;
	alt: string;
	priority?: boolean;
}

/** Full-bleed hero backdrop: art-directed image drifting with the scroll, ambiance, grain and legibility scrims. */
export function CinematicBackdrop({
	src,
	posterPath,
	alt,
	priority,
}: CinematicBackdropProps) {
	return (
		<div className="absolute inset-0 -z-10 overflow-hidden">
			<div className="hero-parallax absolute inset-0">
				<HeroArt
					backdropUrl={src}
					posterPath={posterPath}
					alt={alt}
					priority={priority}
				/>
			</div>
			<PauseWhenOffscreen className="block max-md:hidden absolute inset-0">
				<Aurora intensity={0.4} />
				<Spotlight />
			</PauseWhenOffscreen>
			<div className="absolute inset-0 bg-linear-to-t from-app-bg via-app-bg/55 to-transparent" />
			<div className="absolute inset-0 max-md:hidden bg-linear-to-r from-app-bg via-app-bg/40 to-transparent" />
			<Grain opacity={0.06} />
		</div>
	);
}
