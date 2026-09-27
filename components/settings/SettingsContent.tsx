'use client';

import { useSearchParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { ProfileSettings } from './ProfileSettings';
import { PasswordSettings } from './PasswordSettings';
import { PasskeySettings } from './PasskeySettings';
import { ThemeSettings } from './ThemeSettings';
import { LanguageSettings } from './LanguageSettings';
import { RegionalSettings } from './RegionalSettings';
import { DangerZone } from './DangerZone';
import { SocialLinksSettings } from './SocialLinksSettings';
import { PrivacySettings } from './PrivacySettings';
import { DataSettings } from './DataSettings';
import { NotificationSettings } from './NotificationSettings';
import { StreamingSettings } from './StreamingSettings';
import { SupportSettings } from './SupportSettings';
import { AiAssistantCard } from './AiAssistantCard';
import { SettingsNav, type SettingsTab } from './SettingsNav';
import { isSettingsTab } from './tabs';
import { SignoutButton } from '@/components/auth/SignoutButton';
import type {
	UserProfile,
	PrivacySettings as PrivacySettingsType,
} from '@/types/profile';
import type { WatchProvider } from '@/types/tmdb';
import type { NotificationPreferences } from '@/types/notifications';
import type { McpLinkStatus } from '@/types/mcp';
import { SwapIn } from '@/components/motion/SwapIn';

interface SettingsContentProps {
	user: User | null;
	userProfile: UserProfile | null;
	privacySettings: PrivacySettingsType | null;
	isOAuthOnly: boolean;
	streamingProviders: WatchProvider[];
	selectedProviderIds: number[];
	notificationPreferences: NotificationPreferences;
	mcpLink: McpLinkStatus | null;
}

export function SettingsContent({
	user,
	userProfile,
	privacySettings,
	isOAuthOnly,
	streamingProviders,
	selectedProviderIds,
	notificationPreferences,
	mcpLink,
}: SettingsContentProps) {
	// The URL is the source of truth, so deep links (`?section=`) switch tabs even from Settings
	// itself. A tab click rewrites it with the native History API, which Next syncs into
	// useSearchParams without a server round trip.
	const searchParams = useSearchParams();
	const section = searchParams.get('section');
	const activeTab: SettingsTab = isSettingsTab(section) ? section : 'profile';

	function setActiveTab(tab: SettingsTab) {
		const params = new URLSearchParams(searchParams);
		params.set('section', tab);
		window.history.replaceState(null, '', `?${params}`);
	}

	return (
		<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
			<aside className="lg:w-48 lg:sticky lg:top-20 h-fit">
				<SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />
			</aside>

			<div className="flex-1 min-w-0">
				<SwapIn swapKey={activeTab}>
					{activeTab === 'profile' && (
						<div className="space-y-6">
							<ProfileSettings
								user={user}
								profileAvatarUrl={
									userProfile?.avatar_url ?? null
								}
							/>
							<SocialLinksSettings profile={userProfile} />
						</div>
					)}
					{activeTab === 'security' && (
						<div className="space-y-6">
							<PasswordSettings isOAuthOnly={isOAuthOnly} />
							<PasskeySettings />
						</div>
					)}
					{activeTab === 'notifications' && (
						<NotificationSettings
							initialPreferences={notificationPreferences}
						/>
					)}
					{activeTab === 'appearance' && (
						<div className="space-y-6">
							<ThemeSettings />
						</div>
					)}
					{activeTab === 'services' && (
						<StreamingSettings
							providers={streamingProviders}
							initialSelected={selectedProviderIds}
						/>
					)}
					{activeTab === 'privacy' && (
						<PrivacySettings settings={privacySettings} />
					)}
					{activeTab === 'data' && (
						<div className="space-y-6">
							<LanguageSettings />
							<RegionalSettings user={user} />
							<DataSettings />
							<AiAssistantCard initialLink={mcpLink} />
							<SupportSettings />
							<DangerZone isOAuthOnly={isOAuthOnly} />
						</div>
					)}
				</SwapIn>

				<div className="mt-6 rounded-(--radius-xl) border border-border bg-surface p-4">
					<SignoutButton />
				</div>
			</div>
		</div>
	);
}
