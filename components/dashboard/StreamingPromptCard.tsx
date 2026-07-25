'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolvePrompt } from '@/app/actions/prompts';
import type { PromptState } from '@/lib/prompts/keys';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';

/** Stands in for the "on your services" row while the user has picked no platform. */
export function StreamingPromptCard() {
	const { t, lang } = useTranslation();
	const router = useRouter();
	const [hidden, setHidden] = useState(false);

	if (hidden) return null;

	function settle(state: PromptState) {
		setHidden(true);
		resolvePrompt('streaming', state).catch((error) =>
			reportSwallowed('prompts:resolve', error)
		);
	}

	return (
		<section className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
			<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
				<Tv className="size-5" aria-hidden />
			</span>

			<div className="min-w-0 flex-1">
				<h2 className="text-base font-semibold text-text">
					{t.prompts.streaming.title}
				</h2>
				<p className="mt-1 text-sm text-muted">
					{t.prompts.streaming.description}
				</p>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<Button
					size="sm"
					onClick={() => {
						settle('done');
						router.push(
							localizedHref(lang, '/settings?section=services')
						);
					}}
				>
					{t.prompts.streaming.action}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="text-muted"
					onClick={() => settle('dismissed')}
				>
					{t.prompts.dismiss}
				</Button>
			</div>
		</section>
	);
}
