'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Link2, Sparkles, Unlink } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useGuardedTransition } from '@/hooks/useGuardedTransition';
import { useTranslation } from '@/lib/i18n/context';
import { getLocale } from '@/lib/i18n/utils';
import { formatShortDate } from '@/lib/format';
import { BASE_URL } from '@/lib/metadata';
import { isRefusal } from '@/lib/action-errors';
import { createMcpLink, revokeMcpLink } from '@/app/actions/mcp';
import { AI_ASSISTANT_ANCHOR } from './tabs';
import type { McpAccess, McpLinkStatus } from '@/types/mcp';
import { toastActionError } from '@/lib/action-toast';

/** Lets the user plug their own AI assistant into ReelMark through a secret, revocable MCP link: read-only by default, allowed to change title statuses when the user says so. */
export function AiAssistantCard({
	initialLink,
}: {
	initialLink: McpLinkStatus | null;
}) {
	const { t, lang } = useTranslation();
	const ta = t.settings.aiAssistant;
	const locale = getLocale(lang);
	const [link, setLink] = useState(initialLink);
	const [access, setAccess] = useState<McpAccess>(
		initialLink?.access ?? 'read'
	);
	const [freshUrl, setFreshUrl] = useState<string | null>(null);
	const [confirmingRevoke, setConfirmingRevoke] = useState(false);
	const [isPending, startTransition] = useGuardedTransition();

	// The card streams in with the page, often after Next has tried to scroll to the anchor.
	useEffect(() => {
		if (window.location.hash === `#${AI_ASSISTANT_ANCHOR}`) {
			document
				.getElementById(AI_ASSISTANT_ANCHOR)
				?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, []);

	function handleGenerate() {
		startTransition(async () => {
			try {
				const key = await createMcpLink(access);
				if (isRefusal(key)) {
					toast.error(ta.rateLimited);
					return;
				}
				setFreshUrl(`${BASE_URL}/api/mcp/${key}`);
				setLink({
					createdAt: new Date().toISOString(),
					lastUsedAt: null,
					access,
				});
			} catch (err) {
				toastActionError(err, t.common.actionError);
			}
		});
	}

	function handleRevoke() {
		startTransition(async () => {
			try {
				await revokeMcpLink();
				setLink(null);
				setFreshUrl(null);
				setConfirmingRevoke(false);
				toast.success(ta.revoked);
			} catch (err) {
				toastActionError(err, t.common.actionError);
			}
		});
	}

	function handleCopy() {
		if (!freshUrl) return;
		navigator.clipboard
			.writeText(freshUrl)
			.then(() => toast.success(ta.copied))
			.catch(() => toast.error(t.common.actionError));
	}

	return (
		<Card id={AI_ASSISTANT_ANCHOR} className="scroll-mt-24">
			<CardHeader>
				<CardTitle>{ta.title}</CardTitle>
				<CardDescription>{ta.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{freshUrl && (
					<div className="space-y-2">
						<Label htmlFor="mcp-link">{ta.linkLabel}</Label>
						<div className="flex gap-2">
							<Input
								id="mcp-link"
								readOnly
								value={freshUrl}
								onFocus={(event) =>
									event.currentTarget.select()
								}
								className="font-mono text-xs"
							/>
							<Button
								onClick={handleCopy}
								variant="outline"
								className="shrink-0 gap-2"
							>
								<Copy className="h-4 w-4" />
								{ta.copy}
							</Button>
						</div>
						<p className="text-xs text-muted">{ta.showOnce}</p>
					</div>
				)}

				{link && (
					<p className="flex items-center gap-2 text-sm text-muted">
						<Link2
							className="h-4 w-4 shrink-0"
							aria-hidden="true"
						/>
						<span>
							{ta.activeSince}{' '}
							{formatShortDate(link.createdAt, locale)}
							{' · '}
							{link.lastUsedAt
								? `${ta.lastUsed} ${formatShortDate(link.lastUsedAt, locale)}`
								: ta.neverUsed}
							{' · '}
							{link.access === 'write'
								? ta.accessWrite
								: ta.accessRead}
						</span>
					</p>
				)}

				<label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
					<span className="min-w-0">
						<span className="block text-sm font-medium text-text">
							{ta.allowWrite}
						</span>
						<span className="mt-0.5 block text-xs text-muted">
							{ta.allowWriteHint}
						</span>
					</span>
					<Switch
						checked={access === 'write'}
						onCheckedChange={(checked) =>
							setAccess(checked ? 'write' : 'read')
						}
						aria-label={ta.allowWrite}
					/>
				</label>
				{link && link.access !== access && (
					<p className="text-xs text-gold">{ta.accessMismatch}</p>
				)}

				<div className="flex flex-wrap gap-2">
					<Button
						onClick={handleGenerate}
						loading={isPending}
						variant={link ? 'outline' : 'default'}
						className="gap-2"
					>
						<Sparkles className="h-4 w-4" />
						{link ? ta.regenerate : ta.generate}
					</Button>
					{link && confirmingRevoke && (
						<>
							<Button
								onClick={handleRevoke}
								disabled={isPending}
								variant="ghost"
								className="gap-2 text-red-text hover:bg-red/10"
							>
								<Unlink className="h-4 w-4" />
								{t.common.confirm}
							</Button>
							<Button
								onClick={() => setConfirmingRevoke(false)}
								disabled={isPending}
								variant="ghost"
							>
								{t.common.cancel}
							</Button>
						</>
					)}
					{link && !confirmingRevoke && (
						<Button
							onClick={() => setConfirmingRevoke(true)}
							disabled={isPending}
							variant="ghost"
							className="gap-2"
						>
							<Unlink className="h-4 w-4" />
							{ta.revoke}
						</Button>
					)}
				</div>
				{link && (
					<p className="text-xs text-muted">{ta.regenerateHint}</p>
				)}

				<div>
					<p className="text-sm font-medium text-text">{ta.howTo}</p>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
						{ta.clients.map((client) => (
							<li key={client}>{client}</li>
						))}
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
