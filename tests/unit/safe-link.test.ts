import { describe, expect, it } from 'vitest';
import { webLinkOrNull } from '@/lib/safe-link';

describe('webLinkOrNull', () => {
	it('lets plain web links through untouched', () => {
		for (const url of [
			'https://www.netflix.com/title/70143836',
			'http://example.com/x?a=1#b',
			'HTTPS://EXAMPLE.COM/X',
		]) {
			expect(webLinkOrNull(url)).toBe(url);
		}
	});

	it('rejects schemes that execute when placed in an href', () => {
		for (const url of [
			'javascript:alert(1)',
			'JaVaScRiPt:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'vbscript:msgbox(1)',
		]) {
			expect(webLinkOrNull(url)).toBeNull();
		}
	});

	it('rejects anything that is not an absolute web URL', () => {
		for (const url of [
			'//evil.example/x',
			'nflx://title/1',
			'/relative/path',
			'ftp://example.com/f',
			'',
			undefined,
		]) {
			expect(webLinkOrNull(url)).toBeNull();
		}
	});
});
