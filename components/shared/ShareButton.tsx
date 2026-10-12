'use client';

import { Share } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';
import { BASE_URL } from '@/lib/metadata';
import { shareLink } from '@/lib/share';
import { cn } from '@/lib/utils';

const HIT_AREA = "relative before:absolute before:-inset-2 before:content-['']";

const VARIANTS = {
	hero: {
		look: 'ghost',
		className:
			'h-11 w-11 shrink-0 rounded-full glass-surface border-glass-border text-text shadow-card-xs hover:bg-glass-bg-hover hover:text-text active:scale-95',
	},
	card: {
		look: 'ghost',
		className: `${HIT_AREA} h-8 w-8 shrink-0 p-0 text-muted hover:text-text`,
	},
	outline: {
		look: 'outline',
		className: `${HIT_AREA} h-8 w-8 shrink-0 p-0`,
	},
} as const;

interface ShareButtonProps {
	path: string;
	title: string;
	variant: keyof typeof VARIANTS;
	className?: string;
}

/** Icon button that shares the link to a page: the system share sheet on phones, a copied link elsewhere. */
export function ShareButton({
	path,
	title,
	variant,
	className,
}: ShareButtonProps) {
	const { t } = useTranslation();

	async function handleShare() {
		try {
			const outcome = await shareLink({
				title,
				url: `${BASE_URL}${path}`,
			});
			if (outcome === 'copied') toast.success(t.profile.linkCopied);
		} catch {
			toast.error(t.common.actionError);
		}
	}

	return (
		<Button
			variant={VARIANTS[variant].look}
			size="sm"
			onClick={handleShare}
			aria-label={t.common.share}
			className={cn(VARIANTS[variant].className, className)}
		>
			<Share className="h-4 w-4" aria-hidden />
		</Button>
	);
}
