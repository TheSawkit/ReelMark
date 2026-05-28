'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import type { NavLinksProps } from '@/types/components';

export function NavLinks({
	orientation = 'vertical',
	className,
	onLinkClick,
}: NavLinksProps) {
	const pathname = usePathname();
	const { t } = useTranslation();

	const links = [
		{ href: '/dashboard', label: t.navbar.dashboard },
		{ href: '/explorer', label: t.navbar.explorer },
		{ href: '/library', label: t.navbar.library },
	];

	const isHorizontal = orientation === 'horizontal';

	return (
		<nav
			className={cn(
				isHorizontal ? 'flex flex-row gap-8' : 'flex flex-col gap-2',
				className
			)}
		>
			{links.map((link, index) => (
				<Link
					key={link.href}
					href={link.href}
					onClick={onLinkClick}
					aria-current={pathname === link.href ? 'page' : undefined}
					className={cn(
						'text-muted transition-all duration-(--duration-base) hover:text-text-main text-nowrap relative group inline-flex items-center',
						!isHorizontal &&
							'px-4 py-2 rounded-md hover:bg-surface-2',
						isHorizontal && 'py-2 min-h-11',
						pathname === link.href && 'text-gold font-medium',
						isHorizontal &&
							'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-gold after:w-0 after:transition-all after:duration-(--duration-base) hover:after:w-full',
						isHorizontal && pathname === link.href && 'after:w-full'
					)}
					style={{
						animation: `slideUp var(--duration-medium) ease-out both`,
						animationDelay: `${index * 100}ms`,
					}}
				>
					{link.label}
				</Link>
			))}
		</nav>
	);
}
