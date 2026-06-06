'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNavItems } from '@/components/navigation/use-nav-items';

interface BottomTabBarProps {
	username?: string;
}

/** Mobile-only glass bottom navigation (Home / Explore / Library / Profile). */
export function BottomTabBar({ username }: BottomTabBarProps) {
	const tabs = useNavItems(username);

	return (
		<nav
			className="fixed inset-x-0 bottom-0 z-50 md:hidden"
			style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent"
			/>
			<div className="glass-surface relative mx-4 mb-3 flex h-16 items-center justify-around rounded-[22px] px-1.5 shadow-navbar">
				{tabs.map(({ href, label, icon: Icon, active }) => (
					<Link
						key={label}
						href={href}
						prefetch
						aria-current={active ? 'page' : undefined}
						className="relative flex h-full flex-1 flex-col items-center justify-center gap-1 focus-visible:outline-none"
					>
						{active && (
							<span
								aria-hidden="true"
								className="absolute top-2 h-9 w-9 rounded-xl"
								style={{
									background:
										'radial-gradient(circle, var(--spotlight), transparent 70%)',
								}}
							/>
						)}
						<Icon
							className={cn(
								'relative h-5.5 w-5.5 transition-colors duration-(--duration-fast)',
								active
									? '-translate-y-px text-primary'
									: 'text-muted'
							)}
							strokeWidth={active ? 1.9 : 1.6}
						/>
						<span
							className={cn(
								'text-[10px] transition-colors duration-(--duration-fast)',
								active
									? 'font-bold text-text'
									: 'font-medium text-muted'
							)}
						>
							{label}
						</span>
						{active && (
							<span
								aria-hidden="true"
								className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
							/>
						)}
					</Link>
				))}
			</div>
		</nav>
	);
}
