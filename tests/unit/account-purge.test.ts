import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

vi.mock('server-only', () => ({}));

const { purgeUserData, USER_OWNED_TABLES } =
	await import('@/lib/data/account-purge');

/** Tables of the generated schema that carry a `user_id` column. */
function tablesWithUserId(): string[] {
	const schema = readFileSync(
		path.join(process.cwd(), 'types/database.ts'),
		'utf8'
	);
	const tables = schema.slice(
		schema.indexOf('Tables: {'),
		schema.indexOf('Views:')
	);
	return [
		...tables.matchAll(
			/\n\t\t\t(\w+): \{\n\t\t\t\tRow: \{([\s\S]*?)\n\t\t\t\t\}/g
		),
	]
		.filter(([, , row]) => /\n\t\t\t\t\tuser_id:/.test(row))
		.map(([, table]) => table);
}

type Call = { table: string; op: string; args: unknown[] };

function recordingAdmin(playlistIds: string[] = []) {
	const calls: Call[] = [];
	const admin = {
		from(table: string) {
			const chain = {
				select: () => ({
					eq: async () => ({
						data: playlistIds.map((id) => ({ id })),
						error: null,
					}),
				}),
				delete: () => ({
					eq: async (...args: unknown[]) => {
						calls.push({ table, op: 'eq', args });
						return { error: null };
					},
					in: async (...args: unknown[]) => {
						calls.push({ table, op: 'in', args });
						return { error: null };
					},
					or: async (...args: unknown[]) => {
						calls.push({ table, op: 'or', args });
						return { error: null };
					},
				}),
			};
			return chain;
		},
	};
	return { admin: admin as never, calls };
}

describe('purgeUserData', () => {
	it('covers every table of the schema that has a user_id column', () => {
		expect([...USER_OWNED_TABLES].sort()).toEqual(
			tablesWithUserId().sort()
		);
	});

	it('deletes the AI link first, then every owned row of the user', async () => {
		const { admin, calls } = recordingAdmin(['p1', 'p2']);
		await purgeUserData(admin, 'user-1');

		expect(calls[0]).toEqual({
			table: 'mcp_keys',
			op: 'eq',
			args: ['user_id', 'user-1'],
		});
		expect(calls).toContainEqual({
			table: 'playlist_items',
			op: 'in',
			args: ['playlist_id', ['p1', 'p2']],
		});
		expect(calls).toContainEqual({
			table: 'friendships',
			op: 'or',
			args: ['requester_id.eq.user-1,addressee_id.eq.user-1'],
		});
		expect(calls).toContainEqual({
			table: 'notifications',
			op: 'eq',
			args: ['sender_id', 'user-1'],
		});
		for (const table of USER_OWNED_TABLES) {
			expect(calls).toContainEqual({
				table,
				op: 'eq',
				args: ['user_id', 'user-1'],
			});
		}
	});

	it('stops and names the table when a deletion fails', async () => {
		const failing = {
			from: (table: string) => ({
				select: () => ({
					eq: async () => ({ data: [], error: null }),
				}),
				delete: () => ({
					eq: async () => ({
						error: table === 'reviews' ? { message: 'boom' } : null,
					}),
					or: async () => ({ error: null }),
					in: async () => ({ error: null }),
				}),
			}),
		};
		await expect(purgeUserData(failing as never, 'user-1')).rejects.toThrow(
			'reviews: boom'
		);
	});
});
