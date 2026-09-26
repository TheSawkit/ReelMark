import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { announceNewEpisodes } from '@/lib/push/notify-new-episodes';

/** Daily job (k8s CronJob): notifies followers of freshly aired episodes. `?dryRun=1` only counts. */
export async function POST(request: Request) {
	if (!isCronAuthorized(request))
		return new NextResponse(null, { status: 401 });

	const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
	const today = new Date().toISOString().slice(0, 10);
	return NextResponse.json(await announceNewEpisodes(today, dryRun));
}
