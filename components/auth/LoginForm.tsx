'use client';

import { useActionState, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from '@/components/ui/field';
import { FormError } from '@/components/ui/FormError';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { login } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';

const initialState = { error: '' };

export function LoginForm({
	className,
	...props
}: React.ComponentProps<'div'>) {
	const [state, formAction, isPending] = useActionState(login, initialState);
	const [oauthPending, setOAuthPending] = useState(false);
	const [oauthError, setOAuthError] = useState('');
	const { t, lang } = useTranslation();
	const supabase = createClient();

	const handleOAuthLogin = async (provider: 'google') => {
		setOAuthError('');
		setOAuthPending(true);
		await new Promise<void>((r) => requestAnimationFrame(() => r()));
		const { error } = await supabase.auth.signInWithOAuth({
			provider,
			options: { redirectTo: `${location.origin}/auth/callback` },
		});
		if (error) {
			setOAuthPending(false);
			setOAuthError(error.message);
		}
	};

	return (
		<div
			className={cn('flex flex-col gap-6 auth-form-animate', className)}
			{...props}
		>
			<Card className="transform transition-all duration-(--duration-base) hover:shadow-cinema">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">
						{t.auth.login.title}
					</CardTitle>
					<CardDescription>
						{t.auth.login.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction}>
						<FieldGroup>
							<Field>
								<Button
									variant="outline"
									type="button"
									onClick={() => handleOAuthLogin('google')}
									loading={oauthPending}
									disabled={isPending}
								>
									{!oauthPending && (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
										>
											<path
												d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
												fill="currentColor"
											/>
										</svg>
									)}
									{t.auth.login.google}
								</Button>
							</Field>
							<FieldSeparator>
								{t.auth.login.orEmail}
							</FieldSeparator>
							<Field>
								<FieldLabel htmlFor="email">
									{t.auth.login.email}
								</FieldLabel>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder={
										t.auth.login.placeholders.email
									}
									required
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">
										{t.auth.login.password}
									</FieldLabel>
									<Link
										href={localizedHref(
											lang,
											'/auth/reset-password'
										)}
										className="ml-auto text-sm text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
									>
										{t.auth.login.forgotPassword}
									</Link>
								</div>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder={
										t.auth.login.placeholders.password
									}
									required
								/>
							</Field>
							{(oauthError || state?.error) && (
								<FormError>
									{oauthError || state?.error}
								</FormError>
							)}
							<Field>
								<Button
									type="submit"
									loading={isPending}
									disabled={oauthPending}
								>
									{isPending
										? t.common.loading
										: t.auth.login.button}
								</Button>
								<FieldDescription className="text-center">
									{t.auth.login.dontHaveAccount}{' '}
									<Link href={localizedHref(lang, '/signup')}>
										{t.auth.login.signup}
									</Link>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
			<FieldDescription className="px-6 text-center">
				{t.auth.terms}{' '}
				<span className="underline cursor-default">
					{t.auth.termsLink}
				</span>{' '}
				{t.common.and}{' '}
				<span className="underline cursor-default">
					{t.auth.privacyLink}
				</span>
				.
			</FieldDescription>
		</div>
	);
}
