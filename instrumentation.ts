import * as Sentry from '@sentry/nextjs';

export async function register() {
	const required = [
		'TMDB_READ_ACCESS_TOKEN',
		'NEXT_PUBLIC_SUPABASE_URL',
		'NEXT_PUBLIC_SUPABASE_ANON_KEY',
		'SUPABASE_SERVICE_ROLE_KEY',
	];

	const missing = required.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}`
		);
	}

	const degradesSilently = [
		'NEXT_PUBLIC_SENTRY_DSN',
		'SENTRY_DSN',
		'WATCHMODE_API_KEY',
		'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
		'VAPID_PRIVATE_KEY',
		'VAPID_SUBJECT',
	];

	const absent = degradesSilently.filter((key) => !process.env[key]);

	if (absent.length > 0) {
		console.warn(
			`[instrumentation] Feature disabled, no runtime error will be raised: ${absent.join(', ')}`
		);
	}

	if (process.env.NEXT_RUNTIME === 'nodejs') {
		await import('./sentry.server.config');
	}
	if (process.env.NEXT_RUNTIME === 'edge') {
		await import('./sentry.edge.config');
	}
}

export const onRequestError = Sentry.captureRequestError;
