import * as Sentry from '@sentry/nextjs';
import { filterServerEvent } from '@/lib/sentry-filters';

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	tracesSampleRate: 0,
	debug: false,
	beforeSend: filterServerEvent,
});
