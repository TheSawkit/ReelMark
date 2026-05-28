import type { PrivacyVisibility } from '@/types/profile';

export const VALID_VISIBILITY = new Set<PrivacyVisibility>([
	'public',
	'friends',
	'private',
]);

export function isVisibility(v: unknown): v is PrivacyVisibility {
	return (
		typeof v === 'string' && VALID_VISIBILITY.has(v as PrivacyVisibility)
	);
}

export function parseVisibility(
	v: unknown,
	fallback: PrivacyVisibility = 'private'
): PrivacyVisibility {
	return isVisibility(v) ? v : fallback;
}

export function canViewWithVisibility(
	visibility: PrivacyVisibility,
	ctx: { isOwn: boolean; isFriend: boolean }
): boolean {
	if (ctx.isOwn) return true;
	if (visibility === 'public') return true;
	if (visibility === 'friends' && ctx.isFriend) return true;
	return false;
}
