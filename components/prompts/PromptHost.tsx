'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bell, FolderDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromptBanner } from '@/components/prompts/PromptBanner';
import { IosInstallHint } from '@/components/prompts/IosInstallHint';
import { resolvePrompt } from '@/app/actions/prompts';
import { usePWAInstall, type InstallMode } from '@/hooks/usePWAInstall';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { countVisit } from '@/lib/prompts/device';
import {
	ACCOUNT_PROMPTS,
	type PromptKey,
	type PromptState,
	type PromptStates,
} from '@/lib/prompts/keys';
import {
	promptStore,
	usePromptSlot,
	usePushRequested,
} from '@/lib/prompts/store';
import { useTranslation } from '@/lib/i18n/context';
import type { Translations } from '@/lib/i18n/translations';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';

/** Offering an import only makes sense to someone who came back at least once. */
const IMPORT_MIN_VISITS = 2;

interface PromptCopy {
	icon: ReactNode;
	title: string;
	description: ReactNode;
	actionLabel: string | null;
}

function installCopy(t: Translations, mode: InstallMode): PromptCopy {
	const icon = (
		<Image
			src="/maskable_icon_x96.png"
			alt=""
			width={36}
			height={36}
			className="rounded-(--radius-app-icon)"
		/>
	);

	if (mode === 'ios-safari')
		return {
			icon,
			title: t.pwa.title,
			description: <IosInstallHint />,
			actionLabel: null,
		};

	if (mode === 'ios-other')
		return {
			icon,
			title: t.pwa.title,
			description: t.pwa.iosWrongBrowser,
			actionLabel: null,
		};

	return {
		icon,
		title: t.pwa.title,
		description: t.pwa.description,
		actionLabel: t.pwa.install,
	};
}

function promptCopy(
	key: PromptKey,
	t: Translations,
	mode: InstallMode
): PromptCopy {
	if (key === 'install') return installCopy(t, mode);

	if (key === 'push')
		return {
			icon: <Bell className="size-5" aria-hidden />,
			title: t.prompts.push.title,
			description: t.prompts.push.description,
			actionLabel: t.prompts.push.action,
		};

	return {
		icon: <FolderDown className="size-5" aria-hidden />,
		title: t.prompts.import.title,
		description: t.prompts.import.description,
		actionLabel: t.prompts.import.action,
	};
}

interface PromptHostProps {
	initialStates: PromptStates;
	accountCreatedAt: number | null;
	canImport: boolean;
}

/** Renders the single call-to-action the prompt engine allows for this session, if any. */
export function PromptHost({
	initialStates,
	accountCreatedAt,
	canImport,
}: PromptHostProps) {
	const { t, lang } = useTranslation();
	const router = useRouter();
	const pwa = usePWAInstall();
	const push = usePushSubscription();
	const pushRequested = usePushRequested();
	const { active, open } = usePromptSlot();
	const [pending, setPending] = useState(false);

	useEffect(() => {
		const eligible: PromptKey[] = [];
		if (pwa.visible) eligible.push('install');
		if (pushRequested && push.status === 'off') eligible.push('push');
		if (canImport && countVisit() >= IMPORT_MIN_VISITS)
			eligible.push('import');

		promptStore.evaluate(
			eligible,
			initialStates,
			accountCreatedAt,
			Date.now()
		);
	}, [
		pwa.visible,
		pushRequested,
		push.status,
		canImport,
		initialStates,
		accountCreatedAt,
	]);

	if (active === null) return null;

	const copy = promptCopy(active, t, pwa.mode);

	async function settle(key: PromptKey, state: PromptState) {
		promptStore.resolve(key, state);
		if (!ACCOUNT_PROMPTS.has(key)) return;

		try {
			await resolvePrompt(key, state);
		} catch (error) {
			reportSwallowed('prompts:resolve', error);
		}
	}

	async function handleAction() {
		if (active === null) return;
		setPending(true);
		try {
			if (active === 'install') {
				await pwa.triggerInstall();
				await settle('install', 'done');
				return;
			}
			if (active === 'push') {
				await push.enable();
				await settle('push', 'done');
				return;
			}
			router.push(localizedHref(lang, '/settings?section=data'));
			await settle('import', 'done');
		} finally {
			setPending(false);
		}
	}

	return (
		<PromptBanner
			visible={open}
			icon={copy.icon}
			title={copy.title}
			description={copy.description}
			dismissLabel={t.prompts.dismiss}
			onDismiss={() => void settle(active, 'dismissed')}
			action={
				copy.actionLabel && (
					<Button
						size="sm"
						variant="outline"
						loading={pending}
						onClick={() => void handleAction()}
						className="shrink-0 rounded-full border-primary/30 bg-primary/10 text-primary hover:scale-100 hover:bg-primary/20 hover:text-primary"
					>
						{copy.actionLabel}
					</Button>
				)
			}
		/>
	);
}
