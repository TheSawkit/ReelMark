import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { sendWeeklySuggestions } from '@/lib/push/notify-suggestions';
import { validateUUID } from '@/lib/validators';

/** Weekly job (k8s CronJob): one personalized title per user, one batch per call — `?after=` resumes from the previous `nextCursor`. `?dryRun=1` only counts. */
export async function POST(request: Request) {
	if (!isCronAuthorized(request))
		return new NextResponse(null, { status: 401 });

	const { searchParams } = new URL(request.url);
	const after = searchParams.get('after');
	if (after !== null && validateUUID(after) === null)
		return new NextResponse(null, { status: 400 });

	const dryRun = searchParams.get('dryRun') === '1';
	return NextResponse.json(
		await sendWeeklySuggestions(dryRun, after ?? undefined)
	);
}
