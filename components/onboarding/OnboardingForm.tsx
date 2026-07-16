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
import { FormError } from '@/components/ui/FormError';
import { Input } from '@/components/ui/input';
import { completeOnboarding } from '@/app/[lang]/onboarding/actions';
import { RegionSelect } from '@/components/auth/RegionSelect';
import { useTranslation } from '@/lib/i18n/context';

const initialState = { error: '' };

interface OnboardingFormProps {
	initialUsername: string;
}

export function OnboardingForm({ initialUsername }: OnboardingFormProps) {
	const { t } = useTranslation();
	const [state, formAction, isPending] = useActionState(
		completeOnboarding,
		initialState
	);

	return (
		<div className="centered-screen">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">
						{t.onboarding.title}
					</CardTitle>
					<CardDescription>{t.onboarding.subtitle}</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="username">
									{t.onboarding.usernameLabel}
								</FieldLabel>
								<Input
									id="username"
									name="username"
									type="text"
									defaultValue={initialUsername}
									required
								/>
								<FieldDescription>
									{t.onboarding.usernameHint}
								</FieldDescription>
							</Field>
							<Field>
								<FieldLabel htmlFor="region">
									{t.onboarding.regionLabel} *
								</FieldLabel>
								<RegionSelect />
								<FieldDescription>
									{t.onboarding.regionHint}
								</FieldDescription>
							</Field>
							{state?.error && (
								<FormError>{state.error}</FormError>
							)}
							<Field>
								<Button type="submit" loading={isPending}>
									{isPending
										? t.onboarding.submitting
										: t.onboarding.submit}
								</Button>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
