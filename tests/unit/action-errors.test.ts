import { describe, it, expect } from 'vitest';
import { redirect } from 'next/navigation';
import { isRedirectSignal } from '@/lib/action-errors';

function thrownBy(run: () => void): unknown {
	try {
		run();
	} catch (error) {
		return error;
	}
	return null;
}

describe('isRedirectSignal', () => {
	it("recognises the signal Next's redirect() throws", () => {
		expect(isRedirectSignal(thrownBy(() => redirect('/fr/login')))).toBe(
			true
		);
	});

	it('leaves real failures to the error toast', () => {
		expect(isRedirectSignal(new Error('RATE_LIMITED'))).toBe(false);
		expect(isRedirectSignal(undefined)).toBe(false);
		expect(isRedirectSignal({ digest: 42 })).toBe(false);
	});
});
