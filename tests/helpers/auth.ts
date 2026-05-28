import { existsSync, readFileSync } from 'fs';
import path from 'path';

export function hasValidAuth(): boolean {
	try {
		const p = path.join(process.cwd(), 'tests/.auth/user.json');
		if (!existsSync(p)) return false;
		const state = JSON.parse(readFileSync(p, 'utf-8'));
		return (state.cookies?.length ?? 0) > 0;
	} catch {
		return false;
	}
}
