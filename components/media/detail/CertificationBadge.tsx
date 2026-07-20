import { InfoBadge } from '@/components/ui/InfoBadge';
import { getMovieCertification, getTvShowCertification } from '@/lib/tmdb';
import type { Language } from '@/lib/i18n/translations';
import type { MediaType } from '@/types/tmdb';

interface CertificationBadgeProps {
	mediaId: number;
	mediaType: MediaType;
	lang: Language;
}

/**
 * Age certification badge for the viewer's region. Streams inside a Suspense boundary
 * because resolving the region reads the session, which the static shell cannot do.
 */
export async function CertificationBadge({
	mediaId,
	mediaType,
	lang,
}: CertificationBadgeProps) {
	const certification =
		mediaType === 'movie'
			? await getMovieCertification(mediaId, lang)
			: await getTvShowCertification(mediaId, lang);

	if (!certification) return null;

	return (
		<InfoBadge>
			<span className="font-semibold text-text">{certification}</span>
		</InfoBadge>
	);
}
