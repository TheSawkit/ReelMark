import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const rpcMock = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
	createAdminClient: () => ({ rpc: rpcMock }),
}));

const reportSwallowed = vi.fn();
vi.mock('@/lib/report', () => ({ reportSwallowed }));

const { chargeMcpRequest, countToolCalls } = await import('@/lib/mcp/budget');

const rpc = (body: unknown) =>
	new Request('https://reelmark.test/api/mcp/key', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: typeof body === 'string' ? body : JSON.stringify(body),
	});

const toolCall = { jsonrpc: '2.0', id: 1, method: 'tools/call' };
const toolsList = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

beforeEach(() => {
	rpcMock.mockReset();
	reportSwallowed.mockReset();
});

describe('countToolCalls', () => {
	it('counts tool calls in single messages and batches, nothing else', async () => {
		expect(await countToolCalls(rpc(toolCall))).toBe(1);
		expect(await countToolCalls(rpc(toolsList))).toBe(0);
		expect(await countToolCalls(rpc([toolCall, toolsList, toolCall]))).toBe(
			2
		);
		expect(await countToolCalls(rpc('not json'))).toBe(0);
	});

	it('leaves the body readable for the SDK', async () => {
		const request = rpc(toolCall);
		await countToolCalls(request);
		expect(await request.json()).toEqual(toolCall);
	});
});

describe('chargeMcpRequest — shared budget', () => {
	it('spends every tool window at once, in seconds, for the batch size', async () => {
		rpcMock.mockResolvedValue({ data: null, error: null });

		expect(
			await chargeMcpRequest('shared-user', rpc([toolCall, toolCall]))
		).toBeNull();
		expect(rpcMock).toHaveBeenCalledWith('consume_rate_limits', {
			p_keys: [
				'mcp-tools-minute:shared-user',
				'mcp-tools-day:shared-user',
			],
			p_limits: [30, 50],
			p_window_seconds: [60, 86_400],
			p_cost: 2,
		});
	});

	it('answers 429 with the reset the database returns', async () => {
		const resetAt = new Date(Date.now() + 42_000).toISOString();
		rpcMock.mockResolvedValue({ data: resetAt, error: null });

		const rejected = await chargeMcpRequest('shared-user', rpc(toolCall));
		expect(rejected?.status).toBe(429);
		expect(Number(rejected?.headers.get('Retry-After'))).toBeGreaterThan(
			40
		);
	});

	it('never queries the database for requests without a tool call', async () => {
		expect(
			await chargeMcpRequest('shared-user', rpc(toolsList))
		).toBeNull();
		expect(rpcMock).not.toHaveBeenCalled();
	});
});

describe('chargeMcpRequest — fallback', () => {
	it("falls back to this pod's counters when the database fails, and reports it", async () => {
		rpcMock.mockResolvedValue({
			data: null,
			error: { code: 'PGRST202', message: 'function not found' },
		});

		for (let i = 0; i < 30; i++) {
			expect(
				await chargeMcpRequest('fallback-user', rpc(toolCall))
			).toBeNull();
		}
		const rejected = await chargeMcpRequest('fallback-user', rpc(toolCall));
		expect(rejected?.status).toBe(429);
		expect(Number(rejected?.headers.get('Retry-After'))).toBeGreaterThan(0);
		expect(reportSwallowed).toHaveBeenCalledWith(
			'mcp:budget',
			expect.objectContaining({ code: 'PGRST202' })
		);

		expect(
			await chargeMcpRequest('fallback-user', rpc(toolsList))
		).toBeNull();
	});

	it('falls back when the call itself throws', async () => {
		rpcMock.mockRejectedValue(new Error('fetch failed'));
		expect(
			await chargeMcpRequest('throwing-user', rpc(toolCall))
		).toBeNull();
		expect(reportSwallowed).toHaveBeenCalledOnce();
	});

	it('still stops floods of protocol requests on this pod', async () => {
		let rejected: Response | null = null;
		for (let i = 0; i < 121 && !rejected; i++) {
			rejected = await chargeMcpRequest('flood-user', rpc(toolsList));
		}
		expect(rejected?.status).toBe(429);
		expect(rpcMock).not.toHaveBeenCalled();
	});
});
