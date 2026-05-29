import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb/images';

interface BlurredPosterBackdropProps {
	posterPath: string | null | undefined;
	/**
	 * 'card' — horizontal gradient (left solid → right transparent), poster blurred at scale-125.
	 *          Used inside playlist cards on the profile page.
	 * 'banner' — full-page hero overlay: dark top-to-bottom + subtle left-to-right gradient,
	 *            poster blurred behind the text content.
	 */
	variant?: 'card' | 'banner';
}

export function BlurredPosterBackdrop({
	posterPath,
	variant = 'card',
}: BlurredPosterBackdropProps) {
	if (!posterPath) return null;

	return (
		<>
			<Image
				src={getImageUrl(posterPath, 'w342')}
				alt=""
				fill
				sizes="100vw"
				className="object-cover scale-125 blur-xl opacity-80 pointer-events-none"
				aria-hidden
			/>
			{variant === 'card' ? (
				<>
					<div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-black/10" />
					<div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
				</>
			) : (
				<>
					<div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-background/20" />
					<div className="absolute inset-0 bg-linear-to-r from-background/60 via-transparent to-transparent" />
				</>
			)}
		</>
	);
}
