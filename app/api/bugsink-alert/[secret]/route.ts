import {
	bugsinkAlertSchema,
	forwardAlertToLinear,
	isAlertRelayAuthorized,
} from '@/lib/bugsink-linear';

type Context = { params: Promise<{ secret: string }> };

/**
 * Bugsink custom webhook → Linear ticket. Bugsink signs nothing, so the secret path segment is the
 * credential. A Linear failure answers 502 — Bugsink records the failed delivery — and is only
 * logged: reporting it to Sentry would loop back through Bugsink to this same relay.
 */
export async function POST(request: Request, { params }: Context) {
	const { secret } = await params;
	if (!isAlertRelayAuthorized(secret))
		return new Response(null, { status: 404 });

	const alert = bugsinkAlertSchema.safeParse(
		await request.json().catch(() => null)
	);
	if (!alert.success) return new Response(null, { status: 400 });
	if (alert.data.alert_reason === 'TEST')
		return new Response(null, { status: 204 });

	try {
		await forwardAlertToLinear(alert.data);
		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('[bugsink-alert]', error);
		return new Response(null, { status: 502 });
	}
}
