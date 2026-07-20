'use client';

import { useState, useEffect } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
	getNotificationPreferences,
	updateNotificationPreferences,
} from '@/app/actions/notifications';
import { useTranslation } from '@/lib/i18n/context';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import {
	DEFAULT_NOTIFICATION_PREFERENCES,
	type NotificationPreferences,
} from '@/types/notifications';

const KEYS = [
	'friend_requests',
	'friend_accepted',
	'new_episodes',
	'suggestions',
] as const;

export function NotificationSettings() {
	const { t } = useTranslation();
	const push = usePushSubscription();
	const [prefs, setPrefs] = useState<NotificationPreferences>(
		DEFAULT_NOTIFICATION_PREFERENCES
	);

	const pushHint =
		push.status === 'unsupported'
			? t.settings.notifications.pushUnsupported
			: push.status === 'ios-needs-install'
				? t.settings.notifications.iosHint
				: null;

	useEffect(() => {
		void getNotificationPreferences().then(setPrefs);
	}, []);

	const toggle = (key: (typeof KEYS)[number]) => {
		const next = { ...prefs, [key]: !prefs[key] };
		setPrefs(next);
		void updateNotificationPreferences(next);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.settings.notifications.title}</CardTitle>
				<CardDescription>
					{t.settings.notifications.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-border p-3">
					<div className="min-w-0">
						<p className="text-sm font-medium text-text">
							{t.settings.notifications.push}
						</p>
						<p className="mt-0.5 text-xs text-muted">
							{pushHint ?? t.settings.notifications.pushDesc}
						</p>
					</div>
					<Switch
						checked={push.status === 'on'}
						disabled={push.isPending || !!pushHint}
						onCheckedChange={(checked) =>
							void (checked ? push.enable() : push.disable())
						}
						aria-label={t.settings.notifications.push}
					/>
				</div>

				<p className="mb-3 text-sm font-medium text-text">
					{t.settings.notifications.types}
				</p>
				<div className="space-y-3">
					{KEYS.map((key) => (
						<label
							key={key}
							className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
						>
							<span className="text-sm text-text">
								{t.settings.notifications[key]}
							</span>
							<Switch
								checked={prefs[key]}
								onCheckedChange={() => toggle(key)}
								aria-label={t.settings.notifications[key]}
							/>
						</label>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
