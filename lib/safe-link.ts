/**
 * A third-party URL cleared for use in an `href`, or null.
 * Watch providers, and later any partner feed, hand us links we did not author: a
 * `javascript:` or `data:` scheme placed in an anchor executes on click.
 */
export function webLinkOrNull(url: string | undefined): string | null {
	return url && /^https?:\/\//i.test(url) ? url : null;
}
