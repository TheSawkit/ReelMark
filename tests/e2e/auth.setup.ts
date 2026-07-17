import { test as setup } from '@playwright/test';
import { createServerClient } from '@supabase/ssr';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

const authFile = path.join(process.cwd(), 'tests/.auth/user.json');

async function writeEmptyAuth() {
	await mkdir(path.dirname(authFile), { recursive: true });
	await writeFile(authFile, JSON.stringify({ cookies: [], origins: [] }));
}

setup('authenticate', async ({ context, baseURL }) => {
	const email = process.env.TEST_USER_EMAIL;
	const password = process.env.TEST_USER_PASSWORD;

	if (!email || !password) {
		await writeEmptyAuth();
		return;
	}

	const sessionCookies: { name: string; value: string }[] = [];
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll: () => [],
				setAll: (cookiesToSet) => {
					sessionCookies.push(
						...cookiesToSet.map(({ name, value }) => ({
							name,
							value,
						}))
					);
				},
			},
		}
	);

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		throw new Error(
			`Supabase sign-in failed (${error.message}). Credentials are set, so this is a real failure, not a reason to skip.`
		);
	}

	await context.addCookies(
		sessionCookies.map(({ name, value }) => ({
			name,
			value,
			domain: new URL(baseURL ?? 'http://localhost:3000').hostname,
			path: '/',
		}))
	);

	await context.storageState({ path: authFile });
});
