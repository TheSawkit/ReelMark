import * as Sentry from '@sentry/nextjs';
import { STALE_BUILD_PATTERN } from '@/lib/stale-build';

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	tracesSampleRate: 0,
	debug: false,
	// A tab left open across a deployment asks for chunks the current pods no longer carry.
	// StaleBuildRecovery reloads it; the SDK's own global handlers would still report the
	// failure, drowning real client errors under deployment noise.
	ignoreErrors: [STALE_BUILD_PATTERN],
});

/** Required by the App Router SDK: without it a client error carries no originating-route context. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
