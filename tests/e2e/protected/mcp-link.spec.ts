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

const READ_TOOLS = [
	'get_recommendations',
	'get_taste_profile',
	'get_title',
	'get_watchlist',
	'search_titles',
];

async function toolNames(request: APIRequestContext, path: string) {
	const { tools } = await rpcResult(
		await callMcp(request, path, 'tools/list')
	);
	return {
		names: tools.map(({ name }: { name: string }) => name).sort(),
		writable: tools
			.filter(
				(tool: { annotations?: { readOnlyHint?: boolean } }) =>
					!tool.annotations?.readOnlyHint
			)
			.map(({ name }: { name: string }) => name),
	};
}

test.describe('AI assistant link', () => {
	test('a read-only link, then a write link, each serving its own tools until revoked', async ({
		page,
		request,
	}) => {
		await page.goto('/fr/settings?section=data');
		const allowWrite = page.getByRole('switch', {
			name: 'Autoriser l’assistant à modifier ma bibliothèque',
		});
		const linkField = page.getByLabel('Ton lien de connexion');
		const generate = page.getByRole('button', {
			name: /Générer mon lien|Régénérer le lien/,
		});

		if ((await allowWrite.getAttribute('aria-checked')) === 'true') {
			await allowWrite.click();
		}
		await generate.click();
		const readPath = new URL(await linkField.inputValue()).pathname;
		expect(readPath).toMatch(/^\/api\/mcp\/[A-Za-z0-9_-]{43}$/);

		const init = await callMcp(request, readPath, 'initialize', {
			protocolVersion: '2025-06-18',
			capabilities: {},
			clientInfo: { name: 'e2e', version: '1.0.0' },
		});
		expect(init.status()).toBe(200);
		expect(await toolNames(request, readPath)).toEqual({
			names: READ_TOOLS,
			writable: [],
		});

		const call = await callMcp(request, readPath, 'tools/call', {
			name: 'get_taste_profile',
			arguments: {},
		});
		const taste = JSON.parse((await rpcResult(call)).content[0].text);
		expect(Object.keys(taste).sort()).toEqual(['movie', 'tv']);

		await allowWrite.click();
		await expect(
			page.getByText('Ce réglage s’applique au prochain lien', {
				exact: false,
			})
		).toBeVisible();
		await generate.click();
		await expect(linkField).not.toHaveValue(new RegExp(readPath));
		const writePath = new URL(await linkField.inputValue()).pathname;
		expect(writePath).toMatch(/^\/api\/mcp\/rw-[A-Za-z0-9_-]{43}$/);
		expect(await toolNames(request, writePath)).toEqual({
			names: [...READ_TOOLS, 'update_library'].sort(),
			writable: ['update_library'],
		});

		const replaced = await callMcp(request, readPath, 'tools/list');
		expect(replaced.status()).toBe(404);

		await page.getByRole('button', { name: 'Révoquer' }).click();
		await expect(
			page.getByRole('button', { name: 'Générer mon lien' })
		).toBeVisible();

		const revoked = await callMcp(request, writePath, 'tools/list');
		expect(revoked.status()).toBe(404);
	});
});
