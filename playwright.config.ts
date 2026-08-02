import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : 1,
	// Les 30 s par défaut sont justes pour les scénarios qui rechargent plusieurs fois une page
	// nourrie par TMDB et Supabase : sur une machine occupée, l'enveloppe expirait avant que
	// l'assertion ait quoi que ce soit à dire. Les assertions gardent leur propre délai, donc un
	// vrai défaut échoue toujours sur son message, pas sur la montre.
	timeout: 60_000,
	reporter: 'html',
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
		locale: 'en-US',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			testIgnore: /protected/,
		},
		{
			name: 'authenticated',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'tests/.auth/user.json',
			},
			dependencies: ['setup'],
			testMatch: /protected/,
		},
	],
	webServer: process.env.CI
		? {
				command: 'pnpm start',
				url: 'http://localhost:3000',
				reuseExistingServer: false,
			}
		: undefined,
});
