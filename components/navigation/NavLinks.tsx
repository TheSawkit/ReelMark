'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNavItems } from '@/components/navigation/use-nav-items';
import type { NavLinksProps } from '@/types/components';

/** Desktop horizontal navigation — the same destinations as the mobile tab bar. */
export function NavLinks({ username, className }: NavLinksProps) {
	const items = useNavItems(username);

	return (
		<nav className={cn('flex flex-row items-center gap-1', className)}>
			{items.map(({ key, href, label, icon: Icon, active }) => (
				<Link
					key={key}
					href={href}
					prefetch
					aria-current={active ? 'page' : undefined}
					className={cn(
						'inline-flex items-center gap-2 px-4 py-2 min-h-11 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
						active
							? 'bg-glass-bg-hover text-text font-semibold'
							: 'text-muted hover:text-text hover:bg-glass-bg-hover/60'
					)}
				>
					<Icon
						className={cn('h-4 w-4', active && 'text-primary')}
						strokeWidth={1.8}
					/>
					{label}
				</Link>
			))}
		</nav>
	);
}
