import { timingSafeEqual } from 'node:crypto';

/** Whether a scheduled-job call carries CRON_SECRET; always false when the secret is unset, so a missing env var never opens the route. */
export function isCronAuthorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return false;

	const given = Buffer.from(
		request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
	);
	const expected = Buffer.from(secret);
	return given.length === expected.length && timingSafeEqual(given, expected);
}
