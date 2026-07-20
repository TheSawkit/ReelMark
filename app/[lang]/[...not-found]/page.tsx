import { notFound } from 'next/navigation';

/**
 * Sample params so Cache Components can validate this route at build time.
 * Everything else is rendered on demand (`dynamicParams` stays on).
 */
export async function generateStaticParams() {
	return [{ 'not-found': ['404'] }];
}

/** Funnels any unmatched localized URL to the branded not-found UI (root not-found moved under [lang]). */
export default function CatchAllNotFound() {
	notFound();
}
