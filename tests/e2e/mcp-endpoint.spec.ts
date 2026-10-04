import { test, expect } from '@playwright/test';

test.describe('MCP endpoint', () => {
	test('answers 404 to an unknown or malformed link without leaking why', async ({
		request,
	}) => {
		for (const key of ['nope', 'a'.repeat(43)]) {
			const response = await request.post(`/api/mcp/${key}`, {
				headers: { 'Content-Type': 'application/json' },
				data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
			});
			expect(response.status()).toBe(404);
			expect(await response.text()).toBe('');
		}
	});
});
