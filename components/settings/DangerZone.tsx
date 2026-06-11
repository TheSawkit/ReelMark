'use client';

import { useActionState, useState } from 'react';
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
import { deleteAccount } from '@/app/[lang]/(protected)/settings/actions';
import { useTranslation } from '@/lib/i18n/context';

const initialState = {
	error: undefined as string | undefined,
	success: false,
};

interface DangerZoneProps {
	isOAuthOnly: boolean;
}

export function DangerZone({ isOAuthOnly }: DangerZoneProps) {
	const [state, formAction, isPending] = useActionState(
		deleteAccount,
		initialState
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmText, setConfirmText] = useState('');
	const { t } = useTranslation();

	const handleCancel = () => {
		setIsDeleting(false);
		setConfirmText('');
	};

	return (
		<Card className="border-red">
			<CardHeader>
				<CardTitle className="text-red">
					{t.settings.dangerZone.title}
				</CardTitle>
				<CardDescription>
					{t.settings.dangerZone.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!isDeleting ? (
					<Button
						variant="destructive"
						onClick={() => setIsDeleting(true)}
					>
						{t.settings.dangerZone.deleteAccount}
					</Button>
				) : (
					<form action={formAction} className="space-y-6">
						<div className="bg-red/10 border border-red/20 rounded-lg p-4">
							<p className="text-sm font-medium text-red mb-3">
								{t.danger.warning}
							</p>
							<ul className="text-sm text-red/90 space-y-2 ml-4 list-disc">
								<li>{t.danger.allDataWillBeDeleted}</li>
								<li>{t.danger.accountCannotBeRecovered}</li>
								<li>{t.danger.actionCannotBeUndone}</li>
								<li>{t.danger.willBeLoggedOut}</li>
							</ul>
						</div>

						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="confirmation">
									{t.danger.typeToConfirm}
								</FieldLabel>
								<Input
									id="confirmation"
									name="confirmation"
									type="text"
									value={confirmText}
									onChange={(e) =>
										setConfirmText(
											e.target.value.toUpperCase()
										)
									}
									placeholder={t.danger.confirmPlaceholder}
									autoFocus
									className="uppercase font-mono tracking-widest"
								/>
								<FieldDescription>
									{t.danger.additionalWarning}
								</FieldDescription>
							</Field>
							{isOAuthOnly ? (
								<FieldDescription>
									{t.oauth.deleteNoPassword}
								</FieldDescription>
							) : (
								<Field>
									<FieldLabel htmlFor="delete-password">
										{t.settings.dangerZone.confirmPassword}
									</FieldLabel>
									<Input
										id="delete-password"
										name="password"
										type="password"
										autoComplete="current-password"
									/>
								</Field>
							)}
						</FieldGroup>

						{state.error && (
							<p role="alert" className="text-sm text-red">
								{state.error}
							</p>
						)}

						<div className="flex gap-3 pt-4 border-t">
							<Button
								type="submit"
								variant="destructive"
								disabled={
									isPending ||
									confirmText !== t.danger.confirmPlaceholder
								}
							>
								{isPending
									? t.danger.deleting
									: t.settings.dangerZone.deleteAccount}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={isPending}
							>
								{t.common.cancel}
							</Button>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
