const TMDB_SIZE_PATTERN = /^(https:\/\/image\.tmdb\.org\/t\/p\/)w(\d+)(\/.+)$/;
const TMDB_WIDTHS = [92, 154, 185, 300, 342, 500, 780, 1280];

/** next/image loader: picks the TMDB size matching the device instead of always shipping the caller's size; other sources pass through. */
export default function imageLoader({
	src,
	width,
}: {
	src: string;
	width: number;
}): string {
	const match = TMDB_SIZE_PATTERN.exec(src);
	if (!match) return src;

	const [, base, requested, path] = match;
	const cap = Number(requested);
	const size = TMDB_WIDTHS.find((w) => w >= width && w <= cap) ?? cap;
	return `${base}w${size}${path}`;
}
