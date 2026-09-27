import { describe, it, expect } from 'vitest';
import { getRouteAccess } from '@/lib/proxy/auth-routing';

describe('getRouteAccess', () => {
	it('flags the localized landing so a signed-in visitor is sent to the dashboard by the proxy', () => {
		expect(getRouteAccess('/fr', 'fr').isLanding).toBe(true);
		expect(getRouteAccess('/en/', 'en').isLanding).toBe(true);
	});

	it('does not treat other public pages as the landing', () => {
		expect(getRouteAccess('/fr/movie/27205', 'fr').isLanding).toBe(false);
		expect(getRouteAccess('/fr/terms', 'fr').isLanding).toBe(false);
	});
});
