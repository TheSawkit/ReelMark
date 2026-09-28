import { createHash, randomBytes } from 'node:crypto';
import type { McpAccess } from '@/types/mcp';

const KEY_BYTES = 32;
const WRITE_PREFIX = 'rw-';
const SECRET = '[A-Za-z0-9_-]{43}';
const KEY_PATTERN = new RegExp(`^(${WRITE_PREFIX})?${SECRET}$`);
const WRITE_KEY_LENGTH = WRITE_PREFIX.length + 43;

/** SHA-256 of a link secret — 256 random bits need no slow password hash, only a digest that cannot be reversed. */
export function hashMcpKey(key: string): string {
	return createHash('sha256').update(key).digest('hex');
}

/**
 * A fresh link secret and the hash to store: the secret is shown once to its owner and never
 * persisted. A write link carries the `rw-` prefix inside the hashed value, so a read link cannot
 * be turned into a write link by editing it — the hash would no longer match.
 */
export function generateMcpKey(access: McpAccess): {
	key: string;
	hash: string;
} {
	const secret = randomBytes(KEY_BYTES).toString('base64url');
	const key = access === 'write' ? `${WRITE_PREFIX}${secret}` : secret;
	return { key, hash: hashMcpKey(key) };
}

/** What a link lets the assistant do; links made before write access existed are read-only. */
export function mcpKeyAccess(key: string): McpAccess {
	return key.length === WRITE_KEY_LENGTH && key.startsWith(WRITE_PREFIX)
		? 'write'
		: 'read';
}

/** Whether a path segment can be a link secret at all, so malformed probes never reach the database. */
export function isMcpKeyFormat(value: string): boolean {
	return KEY_PATTERN.test(value);
}
