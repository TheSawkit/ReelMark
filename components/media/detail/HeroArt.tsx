import { getImageProps } from 'next/image';
import { getImageUrl } from '@/lib/tmdb/images';

interface HeroArtProps {
	backdropUrl: string;
	posterPath: string | null;
	alt: string;
	priority?: boolean;
}

const WIDE_SCREEN = '(min-width: 768px)';

/**
 * Art-directed hero picture: the portrait poster fills a phone, the landscape backdrop fills
 * wider screens, and each device downloads only its own (Next's getImageProps art direction).
 * Non-priority art (later slideshow slides) ships a single URL per shape instead of a srcset.
 */
export function HeroArt({
	backdropUrl,
	posterPath,
	alt,
	priority = true,
}: HeroArtProps) {
	const shared = {
		alt,
		fill: true,
		sizes: '100vw',
		loading: priority ? 'eager' : 'lazy',
		fetchPriority: priority ? 'high' : 'auto',
		unoptimized: !priority,
	} as const;
	const { props: wide } = getImageProps({ ...shared, src: backdropUrl });
	const { props: portrait } = getImageProps({
		...shared,
		src: posterPath ? getImageUrl(posterPath, 'w780') : backdropUrl,
	});

	return (
		<picture>
			<source media={WIDE_SCREEN} srcSet={wide.srcSet ?? wide.src} />
			<img
				{...portrait}
				alt={alt}
				className="hero-settle object-cover object-top"
			/>
		</picture>
	);
}
