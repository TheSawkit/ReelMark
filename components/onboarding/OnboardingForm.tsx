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
import { SelectInput } from '@/components/ui/SelectInput';
import { completeOnboarding } from '@/app/[lang]/onboarding/actions';
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
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
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
								<SelectInput id="region" name="region" required>
									<option value="">
										{t.settings.region.placeholder}
									</option>
									<option value="BE">
										{t.settings.region.be}
									</option>
									<option value="FR">
										{t.settings.region.fr}
									</option>
									<option value="US">
										{t.settings.region.us}
									</option>
									<option value="CA">
										{t.settings.region.ca}
									</option>
									<option value="GB">
										{t.settings.region.gb}
									</option>
									<option value="CH">
										{t.settings.region.ch}
									</option>
									<option value="LU">
										{t.settings.region.lu}
									</option>
								</SelectInput>
								<FieldDescription>
									{t.onboarding.regionHint}
								</FieldDescription>
							</Field>
							{state?.error && (
								<p
									role="alert"
									className="text-sm text-red-2 text-center"
								>
									{state.error}
								</p>
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
