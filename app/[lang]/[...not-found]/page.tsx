import { notFound } from 'next/navigation';

/** Funnels any unmatched localized URL to the branded not-found UI (root not-found moved under [lang]). */
export default function CatchAllNotFound() {
	notFound();
}
