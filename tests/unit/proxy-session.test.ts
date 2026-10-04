import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

type SetAll = (
	cookies: { name: string; value: string; options: object }[],
	headers: Record<string, string>
) => void;

const auth = vi.hoisted(() => ({
	user: null as User | null,
	refresh: false,
}));

/** Stands in for Supabase: a call either finds the session valid or rotates its tokens through `setAll`, like an expired access token does. */
vi.mock('@supabase/ssr', () => ({
	createServerClient: (
		_url: string,
		_key: string,
		{ cookies }: { cookies: { setAll: SetAll } }
	) => {
		const rotate = () => {
			if (auth.refresh) {
				cookies.setAll(
					[
						{
							name: 'sb-ref-auth-token',
							value: 'fresh',
							options: {},
						},
					],
					{ 'Cache-Control': 'private, no-store' }
				);
			}
		};
		return {
			auth: {
				getSession: async () => {
					rotate();
					return { data: { session: null }, error: null };
				},
				getClaims: async () => {
					rotate();
					return {
						data: auth.user
							? {
									claims: {
										sub: auth.user.id,
										user_metadata: auth.user.user_metadata,
									},
								}
							: null,
						error: null,
					};
				},
			},
		};
	},
}));

const { refreshSession, handleAuthRouting, getRouteAccess } =
	await import('@/lib/proxy/auth-routing');

const request = (path: string) =>
	new NextRequest(`https://reelmark.test${path}`, {
		headers: { cookie: 'sb-ref-auth-token=stale' },
	});

beforeEach(() => {
	auth.user = null;
	auth.refresh = false;
});

describe('refreshSession', () => {
	it('hands rotated tokens to the browser and to the Server Components of the same request', async () => {
		auth.refresh = true;
		const req = request('/fr/movie/27205');
		const response = await refreshSession(req, new Headers(req.headers));

		expect(response.cookies.get('sb-ref-auth-token')?.value).toBe('fresh');
		expect(response.headers.get('x-middleware-request-cookie')).toContain(
			'sb-ref-auth-token=fresh'
		);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});
});

describe('handleAuthRouting', () => {
	const route = (path: string) => {
		const req = request(path);
		return handleAuthRouting(
			req,
			'fr',
			new Headers(req.headers),
			getRouteAccess(req.nextUrl.pathname, 'fr')
		);
	};

	it('sends a signed-out visitor of a protected page to login, remembering where they were going', async () => {
		const response = await route('/fr/settings?section=data');
		const location = new URL(response.headers.get('location')!);

		expect(location.pathname).toBe('/fr/login');
		expect(location.searchParams.get('next')).toBe(
			'/fr/settings?section=data'
		);
	});

	it('sends a signed-in visitor of login back to the page they had asked for', async () => {
		auth.user = { id: 'u', user_metadata: { username: 'u' } } as never;
		const response = await route(
			`/fr/login?next=${encodeURIComponent('/fr/settings?section=data')}`
		);

		expect(response.headers.get('location')).toBe(
			'https://reelmark.test/fr/settings?section=data'
		);
	});

	it('ignores a next that leaves the site', async () => {
		auth.user = { id: 'u', user_metadata: { username: 'u' } } as never;
		const response = await route('/fr/login?next=//evil.test');

		expect(response.headers.get('location')).toBe(
			'https://reelmark.test/fr/dashboard'
		);
	});

	it('keeps refreshed tokens on its redirects', async () => {
		auth.refresh = true;
		const response = await route('/fr/library');

		expect(response.cookies.get('sb-ref-auth-token')?.value).toBe('fresh');
	});
});
