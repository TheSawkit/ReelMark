'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';

import type { SettingsTab } from './tabs';

export type { SettingsTab };

interface SettingsNavProps {
	onTabChange: (tab: SettingsTab) => void;
	activeTab: SettingsTab;
}

export function SettingsNav({ onTabChange, activeTab }: SettingsNavProps) {
	const { t } = useTranslation();

	const TABS: Array<{ id: SettingsTab; label: string; icon: string }> = [
		{ id: 'profile', label: t.settings.profile.title, icon: '👤' },
		{ id: 'security', label: t.settings.password.title, icon: '🔒' },
		{
			id: 'notifications',
			label: t.settings.notifications.title,
			icon: '🔔',
		},
		{ id: 'appearance', label: t.settings.theme.title, icon: '🎨' },
		{ id: 'services', label: t.settings.streaming.title, icon: '📺' },
		{ id: 'privacy', label: t.settings.privacy.title, icon: '🔐' },
		{ id: 'data', label: t.settings.dangerZone.title, icon: '📁' },
	];

	return (
		<nav className="flex lg:flex-col gap-2">
			{TABS.map((tab) => (
				<button
					key={tab.id}
					onClick={() => onTabChange(tab.id)}
					aria-label={tab.label}
					className={cn(
						'flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-all duration-(--duration-fast) font-medium text-sm whitespace-nowrap lg:whitespace-normal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
						activeTab === tab.id
							? 'bg-primary-hover text-white shadow-card-xs'
							: 'text-muted hover:bg-surface-2 active:bg-surface'
					)}
				>
					<span className="text-lg">{tab.icon}</span>
					<span className="hidden lg:inline">{tab.label}</span>
				</button>
			))}
		</nav>
	);
}
