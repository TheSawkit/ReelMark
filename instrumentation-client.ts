import * as Sentry from '@sentry/nextjs';
import {
	STALE_BUILD_PATTERN,
	isStaleBuildError,
	recoverFromStaleBuild,
} from '@/lib/stale-build';
import { isErrorReportingEnabled } from '@/lib/sentry-filters';

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	enabled: isErrorReportingEnabled(process.env.NEXT_PUBLIC_SENTRY_DSN),
	tracesSampleRate: 0,
	debug: false,
	ignoreErrors: [STALE_BUILD_PATTERN],
});

window.addEventListener('error', (event) => {
	if (isStaleBuildError(event.error ?? event.message))
		recoverFromStaleBuild();
});
window.addEventListener('unhandledrejection', (event) => {
	if (isStaleBuildError(event.reason)) recoverFromStaleBuild();
});

/** Required by the App Router SDK: without it a client error carries no originating-route context. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
