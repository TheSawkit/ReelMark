import Image from 'next/image';
import { Aurora } from '@/components/effects/Aurora';
import { Spotlight } from '@/components/effects/Spotlight';
import { Grain } from '@/components/effects/Grain';
import { PauseWhenOffscreen } from '@/components/effects/PauseWhenOffscreen';

interface CinematicBackdropProps {
	src: string;
	alt: string;
}

/** Shared cinematic hero backdrop: image + aurora/spotlight ambiance + grain + fade gradients. */
export function CinematicBackdrop({ src, alt }: CinematicBackdropProps) {
	return (
		<div className="absolute inset-x-0 inset-y-0 -z-10 overflow-hidden animate-in fade-in duration-(--duration-slower) motion-reduce:animate-none">
			<Image
				src={src}
				alt={alt}
				fill
				priority
				className="page-top-offset object-cover object-top"
				sizes="100vw"
			/>
			<PauseWhenOffscreen className="block max-md:hidden absolute inset-0">
				<Aurora intensity={0.4} />
				<Spotlight />
			</PauseWhenOffscreen>
			<div className="absolute inset-0 bg-linear-to-t from-app-bg via-app-bg/40 to-transparent" />
			<div className="absolute inset-0 bg-linear-to-r from-app-bg via-app-bg/40 to-transparent" />
			<Grain opacity={0.06} />
		</div>
	);
}
