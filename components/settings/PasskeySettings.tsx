'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { KeyRound, Plus } from 'lucide-react';
import type { PasskeyListItem } from '@supabase/supabase-js';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteIconButton } from '@/components/ui/DeleteIconButton';
import { createClient } from '@/lib/supabase/client';
import { formatShortDate } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/context';
import { getLocale } from '@/lib/i18n/utils';
import { usePasskeySupport } from '@/hooks/usePasskeySupport';

/** Lets the signed-in user enroll, review and revoke the passkeys tied to their account. */
export function PasskeySettings() {
	const { t, lang } = useTranslation();
	const locale = getLocale(lang);
	const supabase = createClient();
	const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([]);
	const [isPending, startTransition] = useTransition();
	const supported = usePasskeySupport();

	const tp = t.settings.passkeys;

	const refresh = useCallback(async () => {
		const { data, error } = await supabase.auth.passkey.list();
		if (!error && data) setPasskeys(data);
	}, [supabase]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		refresh();
	}, [refresh]);

	function handleAdd() {
		startTransition(async () => {
			const { error } = await supabase.auth.registerPasskey();
			if (error) {
				if (error.name !== 'NotAllowedError')
					toast.error(error.message);
				return;
			}
			toast.success(tp.added);
			await refresh();
		});
	}

	function handleRemove(passkeyId: string) {
		startTransition(async () => {
			const { error } = await supabase.auth.passkey.delete({ passkeyId });
			if (error) {
				toast.error(error.message);
				return;
			}
			toast.success(tp.removed);
			await refresh();
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{tp.title}</CardTitle>
				<CardDescription>{tp.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{!supported ? (
					<p className="text-sm text-muted">{tp.unsupported}</p>
				) : (
					<>
						{passkeys.length === 0 ? (
							<p className="text-sm text-muted">{tp.empty}</p>
						) : (
							<ul className="space-y-2">
								{passkeys.map((passkey) => (
									<li
										key={passkey.id}
										className="flex items-center gap-3 rounded-lg border border-border/30 bg-surface-2/30 px-3 py-2.5"
									>
										<KeyRound
											className="h-4 w-4 shrink-0 text-muted"
											aria-hidden="true"
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-text">
												{passkey.friendly_name ||
													tp.unnamed}
											</p>
											<p className="text-xs text-muted">
												{tp.addedOn}{' '}
												{formatShortDate(
													passkey.created_at,
													locale
												)}
												{' · '}
												{passkey.last_used_at
													? `${tp.lastUsed} ${formatShortDate(passkey.last_used_at, locale)}`
													: tp.neverUsed}
											</p>
										</div>
										<DeleteIconButton
											onClick={() =>
												handleRemove(passkey.id)
											}
											disabled={isPending}
											ariaLabel={tp.remove}
										/>
									</li>
								))}
							</ul>
						)}

						<Button
							onClick={handleAdd}
							loading={isPending}
							variant="outline"
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							{tp.add}
						</Button>
					</>
				)}
			</CardContent>
		</Card>
	);
}
