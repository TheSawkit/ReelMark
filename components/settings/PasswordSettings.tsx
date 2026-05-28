'use client';

import { useActionState } from 'react';
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
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { updatePassword } from '@/app/settings/actions';
import { useTranslation } from '@/lib/i18n/context';

const initialState = {
	error: undefined,
	success: false,
	message: '',
};

export function PasswordSettings() {
	const { t } = useTranslation();
	const [state, formAction, isPending] = useActionState(
		updatePassword,
		initialState
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.settings.password.title}</CardTitle>
				<CardDescription>
					{t.settings.password.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={formAction} className="space-y-6">
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="password">
								{t.settings.password.newPassword}
							</FieldLabel>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="••••••••"
								required
							/>
							<FieldDescription>
								{t.settings.password.minChars}
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel htmlFor="confirm-password">
								{t.settings.password.confirmPassword}
							</FieldLabel>
							<Input
								id="confirm-password"
								name="confirm-password"
								type="password"
								placeholder="••••••••"
								required
							/>
						</Field>
					</FieldGroup>

					{state.error && (
						<p role="alert" className="text-sm text-red">
							{state.error}
						</p>
					)}
					{state.success && (
						<p role="status" className="text-sm text-gold">
							{state.message}
						</p>
					)}

					<Button type="submit" disabled={isPending}>
						{isPending
							? t.common.updating
							: t.settings.password.updatePassword}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
