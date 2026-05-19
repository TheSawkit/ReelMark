'use client'

import { Lock, Users } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'
import type { PrivacyVisibility } from '@/types/profile'

interface PrivacyBlockProps {
    visibility: PrivacyVisibility
}

export function PrivacyBlock({ visibility }: PrivacyBlockProps) {
    const { t } = useTranslation()
    const isPrivate = visibility === 'private'

    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
            {isPrivate ? (
                <Lock className="h-8 w-8 opacity-40" />
            ) : (
                <Users className="h-8 w-8 opacity-40" />
            )}
            <p className="text-sm font-medium">
                {isPrivate ? t.profile.private : t.profile.friendsOnly}
            </p>
            <p className="text-xs opacity-60">
                {isPrivate ? t.profile.privateDesc : t.profile.friendsOnlyDesc}
            </p>
        </div>
    )
}
