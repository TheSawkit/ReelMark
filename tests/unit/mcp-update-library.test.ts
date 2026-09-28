import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMcpHandler } from '@modelcontextprotocol/server';

vi.mock('server-only', () => ({}));

const writes = vi.hoisted(() => ({
	upsert: vi.fn(async () => {}),
	remove: vi.fn(async () => {}),
	revalidate: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createAdminClient: () => ({}) }));
vi.mock('@/lib/data/mcp', () => ({
	getMcpUserContext: async () => ({ lang: 'fr', region: 'BE' }),
}));
vi.mock('@/lib/data/watchlist-writes', () => ({
	upsertWatchlistEntry: writes.upsert,
	deleteWatchlistEntry: writes.remove,
}));
vi.mock('@/lib/revalidate', () => ({
	revalidateWatchlistPaths: writes.revalidate,
}));
vi.mock('@/lib/tmdb', () => ({
	getGenres: async () => ({}),
	searchMulti: async () => [],
}));
vi.mock('@/lib/tmdb/media-endpoints', () => ({
	fetchWatchProviders: async () => null,
	fetchMediaDetails: async (type: string, id: number) =>
		type === 'movie'
			? { id, title: 'Prisoners', poster_path: '/p.jpg' }
			: { id, name: 'Severance', poster_path: null },
}));

const { createReelMarkMcpServer } = await import('@/lib/mcp/server');

const handler = createMcpHandler(({ authInfo }) =>
	createReelMarkMcpServer(
		authInfo!.clientId,
		authInfo!.scopes.includes('library:write') ? 'write' : 'read'
	)
);

type RpcResult = {
	isError?: boolean;
	content: { text: string }[];
	tools?: { name: string }[];
};

async function rpc(
	method: string,
	params: object,
	access: 'read' | 'write'
): Promise<{ result?: RpcResult; error?: { message: string } }> {
	const response = await handler.fetch(
		new Request('https://reelmark.test/api/mcp/key', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json, text/event-stream',
			},
			body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
		}),
		{
			authInfo: {
				token: '',
				clientId: 'user-1',
				scopes: access === 'write' ? ['library:write'] : [],
			},
		}
	);
	const body = await response.text();
	return JSON.parse(
		body
			.split('\n')
			.filter((line) => line.startsWith('data:'))
			.map((line) => line.slice('data:'.length))
			.join('')
	);
}

async function callTool(args: object): Promise<RpcResult> {
	const { result } = await rpc(
		'tools/call',
		{ name: 'update_library', arguments: args },
		'write'
	);
	return result!;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('update_library', () => {
	it('marks a title as watched for the link owner, with its TMDB title and poster', async () => {
		const result = await callTool({
			type: 'movie',
			id: 146233,
			status: 'watched',
		});

		expect(result.isError).toBeFalsy();
		expect(writes.upsert).toHaveBeenCalledWith(
			expect.anything(),
			'user-1',
			{
				mediaId: 146233,
				mediaType: 'movie',
				mediaTitle: 'Prisoners',
				posterPath: '/p.jpg',
				status: 'watched',
			}
		);
		expect(writes.revalidate).toHaveBeenCalledWith('movie', 146233);
		expect(JSON.parse(result.content[0].text)).toMatchObject({
			status: 'watched',
			url: expect.stringContaining('/fr/movie/146233'),
		});
	});

	it('removes a title from the library', async () => {
		const result = await callTool({
			type: 'tv',
			id: 95396,
			status: 'remove',
		});

		expect(result.isError).toBeFalsy();
		expect(writes.remove).toHaveBeenCalledWith(
			expect.anything(),
			'user-1',
			95396,
			'tv'
		);
		expect(JSON.parse(result.content[0].text).status).toBeNull();
	});

	it('refuses to abandon a movie', async () => {
		const result = await callTool({
			type: 'movie',
			id: 146233,
			status: 'abandoned',
		});

		expect(result.isError).toBe(true);
		expect(writes.upsert).not.toHaveBeenCalled();
	});
});

describe('read-only link', () => {
	it('does not list update_library', async () => {
		const read = await rpc('tools/list', {}, 'read');
		const write = await rpc('tools/list', {}, 'write');
		const names = (tools?: { name: string }[]) =>
			(tools ?? []).map(({ name }) => name);

		expect(names(read.result?.tools)).not.toContain('update_library');
		expect(names(read.result?.tools)).toContain('get_watchlist');
		expect(names(write.result?.tools)).toContain('update_library');
	});

	it('cannot call update_library', async () => {
		const { result, error } = await rpc(
			'tools/call',
			{
				name: 'update_library',
				arguments: { type: 'movie', id: 146233, status: 'watched' },
			},
			'read'
		);

		expect(error ?? result?.isError).toBeTruthy();
		expect(writes.upsert).not.toHaveBeenCalled();
	});
});
