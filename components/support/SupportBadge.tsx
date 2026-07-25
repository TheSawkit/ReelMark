import Link from 'next/link';
import { Heart } from 'lucide-react';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

interface SupportBadgeProps {
	lang: Language;
	label: string;
	className?: string;
}

/** Pill link to the donation page — stands out from the plain text links it sits next to. */
export function SupportBadge({ lang, label, className }: SupportBadgeProps) {
	return (
		<Link
			href={localizedHref(lang, '/support')}
			className={cn(
				'glass-surface inline-flex shrink-0 items-center gap-1.5 rounded-full border-primary/40 px-3 py-1.5 font-medium whitespace-nowrap text-text transition-colors duration-(--duration-fast) ease-apple hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
				className
			)}
		>
			<Heart className="size-3.5 fill-primary text-primary" aria-hidden />
			{label}
		</Link>
	);
}
