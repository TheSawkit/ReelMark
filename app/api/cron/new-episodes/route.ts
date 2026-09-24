import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { announceNewEpisodes } from '@/lib/push/notify-new-episodes';

function isAuthorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return false;

	const given = Buffer.from(
		request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
	);
	const expected = Buffer.from(secret);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Daily job (k8s CronJob): notifies followers of freshly aired episodes. `?dryRun=1` only counts. */
export async function POST(request: Request) {
	if (!isAuthorized(request)) return new NextResponse(null, { status: 401 });

	const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
	const today = new Date().toISOString().slice(0, 10);
	return NextResponse.json(await announceNewEpisodes(today, dryRun));
}
