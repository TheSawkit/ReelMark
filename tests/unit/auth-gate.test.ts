import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
	user: null as { id: string } | null,
	headers: new Headers(),
}));

vi.mock('@/lib/supabase/server', () => ({
	createClient: async () => ({
		auth: { getUser: async () => ({ data: { user: state.user } }) },
	}),
}));
vi.mock('next/headers', () => ({ headers: async () => state.headers }));
vi.mock('@/lib/i18n/server', () => ({ getServerLanguage: async () => 'fr' }));
vi.mock('next/navigation', () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT ${url}`);
	},
}));

const { getAuthenticatedUser } = await import('@/lib/supabase/auth-helpers');

beforeEach(() => {
	state.user = null;
	state.headers = new Headers();
});

describe('getAuthenticatedUser', () => {
	it('sends a signed-out caller to login, back to the page the action ran on', async () => {
		state.headers.set('x-url', '/fr/movie/27205?tab=cast');

		await expect(getAuthenticatedUser()).rejects.toThrow(
			`REDIRECT /fr/login?next=${encodeURIComponent('/fr/movie/27205?tab=cast')}`
		);
	});

	it('drops a return path that could leave the site', async () => {
		state.headers.set('x-url', '//evil.test');

		await expect(getAuthenticatedUser()).rejects.toThrow(
			/^REDIRECT \/fr\/login$/
		);
	});

	it('hands back the user when signed in', async () => {
		state.user = { id: 'user-1' };

		await expect(getAuthenticatedUser()).resolves.toMatchObject({
			userId: 'user-1',
		});
	});
});
