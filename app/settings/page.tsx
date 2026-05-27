import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SettingsContent } from '@/components/settings/SettingsContent'
import { PageLayout, PageHeader } from '@/components/layout/PageLayout'
import { getTranslations } from '@/lib/i18n/server'
import { USER_PROFILE_COLUMNS, PRIVACY_COLUMNS } from '@/lib/supabase/columns'
import type { UserProfile, PrivacySettings } from '@/types/profile'

export async function generateMetadata() {
    const t = await getTranslations()
    return {
        title: t.settings.title,
        description: t.settings.subtitle,
        robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
        },
    }
}

export default async function SettingsPage() {
    const user = await requireAuth()
    const supabase = await createClient()

    const [profileResult, privacyResult] = await Promise.all([
        supabase.from('user_profiles').select(USER_PROFILE_COLUMNS).eq('user_id', user.id).maybeSingle(),
        supabase.from('privacy_settings').select(PRIVACY_COLUMNS).eq('user_id', user.id).maybeSingle(),
    ])

    const userProfile = (profileResult.data as UserProfile | null) ?? null
    const privacySettings = (privacyResult.data as PrivacySettings | null) ?? null

    const t = await getTranslations()

    return (
        <PageLayout>
            <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />
            <SettingsContent user={user} userProfile={userProfile} privacySettings={privacySettings} />
        </PageLayout>
    )
}
