import { createHash, randomBytes } from 'node:crypto';

const KEY_BYTES = 32;
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** SHA-256 of a link secret — 256 random bits need no slow password hash, only a digest that cannot be reversed. */
export function hashMcpKey(key: string): string {
	return createHash('sha256').update(key).digest('hex');
}

/** A fresh link secret and the hash to store: the secret is shown once to its owner and never persisted. */
export function generateMcpKey(): { key: string; hash: string } {
	const key = randomBytes(KEY_BYTES).toString('base64url');
	return { key, hash: hashMcpKey(key) };
}

/** Whether a path segment can be a link secret at all, so malformed probes never reach the database. */
export function isMcpKeyFormat(value: string): boolean {
	return KEY_PATTERN.test(value);
}
