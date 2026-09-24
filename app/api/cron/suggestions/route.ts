import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { sendWeeklySuggestions } from '@/lib/push/notify-suggestions';

/** Weekly job (k8s CronJob): one personalized title per user. `?dryRun=1` only counts. */
export async function POST(request: Request) {
	if (!isCronAuthorized(request))
		return new NextResponse(null, { status: 401 });

	const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
	return NextResponse.json(await sendWeeklySuggestions(dryRun));
}
