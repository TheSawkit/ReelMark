import Image from 'next/image';
import { Aurora } from '@/components/effects/Aurora';
import { Spotlight } from '@/components/effects/Spotlight';
import { Grain } from '@/components/effects/Grain';

interface CinematicBackdropProps {
	src: string;
	alt: string;
}

/** Shared cinematic hero backdrop: image + aurora/spotlight ambiance + grain + fade gradients. */
export function CinematicBackdrop({ src, alt }: CinematicBackdropProps) {
	return (
		<div className="absolute inset-x-0 inset-y-0 -z-10 overflow-hidden">
			<Image
				src={src}
				alt={alt}
				fill
				priority
				className="page-top-offset object-cover object-top"
				sizes="100vw"
			/>
			<Aurora intensity={0.4} />
			<Spotlight />
			<div className="absolute inset-0 bg-linear-to-t from-app-bg via-app-bg/40 to-transparent" />
			<div className="absolute inset-0 bg-linear-to-r from-app-bg via-app-bg/40 to-transparent" />
			<Grain opacity={0.06} />
		</div>
	);
}
