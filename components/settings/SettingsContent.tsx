'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { ProfileSettings } from './ProfileSettings';
import { PasswordSettings } from './PasswordSettings';
import { ThemeSettings } from './ThemeSettings';
import { LanguageSettings } from './LanguageSettings';
import { RegionalSettings } from './RegionalSettings';
import { DangerZone } from './DangerZone';
import { SocialLinksSettings } from './SocialLinksSettings';
import { PrivacySettings } from './PrivacySettings';
import { DataSettings } from './DataSettings';
import { SettingsNav, type SettingsTab } from './SettingsNav';
import { SignoutButton } from '@/components/auth/SignoutButton';
import type {
	UserProfile,
	PrivacySettings as PrivacySettingsType,
} from '@/types/profile';

interface SettingsContentProps {
	user: User | null;
	userProfile: UserProfile | null;
	privacySettings: PrivacySettingsType | null;
}

export function SettingsContent({
	user,
	userProfile,
	privacySettings,
}: SettingsContentProps) {
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

	return (
		<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
			<aside className="lg:w-48 lg:sticky lg:top-20 h-fit">
				<SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />
			</aside>

			<main className="flex-1 min-w-0">
				{activeTab === 'profile' && (
					<div className="space-y-6">
						<ProfileSettings user={user} />
						<SocialLinksSettings profile={userProfile} />
					</div>
				)}
				{activeTab === 'security' && <PasswordSettings />}
				{activeTab === 'appearance' && (
					<div className="space-y-6">
						<ThemeSettings />
					</div>
				)}
				{activeTab === 'privacy' && (
					<PrivacySettings settings={privacySettings} />
				)}
				{activeTab === 'data' && (
					<div className="space-y-6">
						<LanguageSettings />
						<RegionalSettings user={user} />
						<DataSettings />
						<DangerZone />
					</div>
				)}

				<div className="mt-6 rounded-(--radius-xl) border border-border bg-surface p-4">
					<SignoutButton />
				</div>
			</main>
		</div>
	);
}
