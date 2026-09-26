import { getImageProps } from 'next/image';
import { getImageUrl } from '@/lib/tmdb/images';

interface HeroArtProps {
	backdropUrl: string;
	posterPath: string | null;
	alt: string;
}

const WIDE_SCREEN = '(min-width: 768px)';

/**
 * Art-directed hero picture: the portrait poster fills a phone, the landscape backdrop fills
 * wider screens, and each device downloads only its own (Next's getImageProps art direction).
 */
export function HeroArt({ backdropUrl, posterPath, alt }: HeroArtProps) {
	const shared = {
		alt,
		fill: true,
		sizes: '100vw',
		loading: 'eager',
		fetchPriority: 'high',
	} as const;
	const {
		props: { srcSet: wideSrcSet },
	} = getImageProps({ ...shared, src: backdropUrl });
	const { props: portrait } = getImageProps({
		...shared,
		src: posterPath ? getImageUrl(posterPath, 'w780') : backdropUrl,
	});

	return (
		<picture>
			<source media={WIDE_SCREEN} srcSet={wideSrcSet} />
			<img {...portrait} alt={alt} className="hero-settle object-cover object-top" />
		</picture>
	);
}
