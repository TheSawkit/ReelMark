import {
	test,
	expect,
	type APIRequestContext,
	type APIResponse,
} from '@playwright/test';
import { hasValidAuth } from '../../helpers/auth';

const MCP_HEADERS = {
	'Content-Type': 'application/json',
	Accept: 'application/json, text/event-stream',
};

function callMcp(
	request: APIRequestContext,
	path: string,
	method: string,
	params: object = {}
) {
	return request.post(path, {
		headers: MCP_HEADERS,
		data: { jsonrpc: '2.0', id: 1, method, params },
	});
}

/** Legacy MCP clients get their answer as one SSE event; modern ones as plain JSON. */
async function rpcResult(response: APIResponse) {
	const body = await response.text();
	const data = body.startsWith('event:')
		? body
				.split('\n')
				.filter((line) => line.startsWith('data:'))
				.map((line) => line.slice('data:'.length))
				.join('')
		: body;
	return JSON.parse(data).result;
}

test.beforeEach(() => {
	test.skip(
		!hasValidAuth(),
		'No valid auth session — skipping authenticated tests'
	);
});

test.describe('AI assistant link', () => {
	test('a generated link serves the read-only tools until it is revoked', async ({
		page,
		request,
	}) => {
		await page.goto('/fr/settings?section=data');

		await page
			.getByRole('button', { name: /Générer mon lien|Régénérer le lien/ })
			.click();
		const url = await page.getByLabel('Ton lien de connexion').inputValue();
		const path = new URL(url).pathname;
		expect(path).toMatch(/^\/api\/mcp\/[A-Za-z0-9_-]{43}$/);

		const init = await callMcp(request, path, 'initialize', {
			protocolVersion: '2025-06-18',
			capabilities: {},
			clientInfo: { name: 'e2e', version: '1.0.0' },
		});
		expect(init.status()).toBe(200);

		const list = await callMcp(request, path, 'tools/list');
		const result = await rpcResult(list);
		const tools = result.tools.map(({ name }: { name: string }) => name);
		expect(tools.sort()).toEqual([
			'get_recommendations',
			'get_taste_profile',
			'get_title',
			'get_watchlist',
			'search_titles',
		]);
		for (const tool of result.tools) {
			expect(tool.annotations?.readOnlyHint).toBe(true);
		}

		const call = await callMcp(request, path, 'tools/call', {
			name: 'get_taste_profile',
			arguments: {},
		});
		const taste = JSON.parse((await rpcResult(call)).content[0].text);
		expect(Object.keys(taste).sort()).toEqual(['movie', 'tv']);

		await page.getByRole('button', { name: 'Révoquer' }).click();
		await expect(
			page.getByRole('button', { name: 'Générer mon lien' })
		).toBeVisible();

		const revoked = await callMcp(request, path, 'tools/list');
		expect(revoked.status()).toBe(404);
	});
});
