import type { ReactElement } from 'react';

/**
 * 404 rendered outside any locale segment.
 *
 * `app/[lang]/layout.tsx` is the root layout, so its `notFound()` for an unknown language had
 * no parent boundary to land in and escalated to `global-error` — a 500 for every unmatched
 * path a crawler tries (`/config.json`, a missing static file). This page gives it a home, and
 * carries its own `<html>` for the same reason `global-error` does.
 */
export default function NotFound(): ReactElement {
	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: '#0a0a0a',
					color: '#fff',
					fontFamily: 'system-ui, sans-serif',
					textAlign: 'center',
				}}
			>
				<main>
					<h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem' }}>
						404
					</h1>
					<p style={{ opacity: 0.7, margin: '0 0 1.5rem' }}>
						Cette page n’existe pas.
					</p>
					<a href="/" style={{ color: '#b9090b', fontWeight: 600 }}>
						Retour à l’accueil
					</a>
				</main>
			</body>
		</html>
	);
}
