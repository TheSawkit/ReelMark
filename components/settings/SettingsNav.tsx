'use client';

import { Bell, FolderOpen, Lock, Palette, ShieldCheck, Tv, User, type LucideIcon } from 'lucide-react';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import { ActiveIndicator } from '@/components/motion/ActiveIndicator';
import { useTranslation } from '@/lib/i18n/context';

import type { SettingsTab } from './tabs';

export type { SettingsTab };

interface SettingsNavProps {
	onTabChange: (tab: SettingsTab) => void;
	activeTab: SettingsTab;
}

export function SettingsNav({ onTabChange, activeTab }: SettingsNavProps) {
	const { t } = useTranslation();
	const indicatorId = useId();

	const TABS: Array<{ id: SettingsTab; label: string; icon: LucideIcon }> = [
		{ id: 'profile', label: t.settings.profile.title, icon: User },
		{ id: 'security', label: t.settings.password.title, icon: Lock },
		{
			id: 'notifications',
			label: t.settings.notifications.title,
			icon: Bell,
		},
		{ id: 'appearance', label: t.settings.theme.title, icon: Palette },
		{ id: 'services', label: t.settings.streaming.title, icon: Tv },
		{ id: 'privacy', label: t.settings.privacy.title, icon: ShieldCheck },
		{ id: 'data', label: t.settings.dangerZone.title, icon: FolderOpen },
	];

	return (
		<nav className="flex lg:flex-col gap-2">
			{TABS.map((tab) => (
				<button
					key={tab.id}
					onClick={() => onTabChange(tab.id)}
					aria-label={tab.label}
					className={cn(
						'relative isolate flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition duration-(--duration-fast) font-medium text-sm whitespace-nowrap lg:whitespace-normal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
						activeTab === tab.id
							? 'text-white'
							: 'text-muted hover:bg-surface-2 active:bg-surface'
					)}
				>
					{activeTab === tab.id && (
						<ActiveIndicator
							layoutId={`${indicatorId}-settings`}
							className="inset-0 -z-10 rounded-lg bg-primary-hover shadow-card-xs"
						/>
					)}
					<span className="flex h-7 items-center">
						<tab.icon className="size-5 shrink-0" aria-hidden />
					</span>
					<span className="inline max-lg:hidden">{tab.label}</span>
				</button>
			))}
		</nav>
	);
}
