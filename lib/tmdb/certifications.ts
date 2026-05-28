import type {
    ReleaseDatesResponse,
    ContentRatingsResponse,
} from '@/types/tmdb';

export function findLocalCertification(
    releaseDates: ReleaseDatesResponse,
    userRegion: string
): string | undefined {
    const allCountries = [userRegion, 'US'];

    for (const countryCode of allCountries) {
        const countryRelease = releaseDates.results.find(
            (r) => r.iso_3166_1 === countryCode
        );
        const validCert = countryRelease?.release_dates.find((rd) =>
            rd.certification?.trim()
        );
        if (validCert) return validCert.certification.trim();
    }

    const firstAvailable = releaseDates.results
        .flatMap((r) => r.release_dates)
        .find((rd) => rd.certification?.trim());

    return firstAvailable?.certification?.trim();
}

export function findTvCertification(
    ratings: ContentRatingsResponse,
    userRegion: string
): string | undefined {
    const allCountries = [userRegion, 'US'];

    for (const countryCode of allCountries) {
        const rating = ratings.results.find(
            (r) => r.iso_3166_1 === countryCode
        );
        if (rating?.rating?.trim()) return rating.rating.trim();
    }

    return ratings.results[0]?.rating?.trim();
}
