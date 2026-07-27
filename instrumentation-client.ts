import * as Sentry from '@sentry/nextjs';

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	tracesSampleRate: 0,
	debug: false,
});

/** Required by the App Router SDK: without it a client error carries no originating-route context. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
