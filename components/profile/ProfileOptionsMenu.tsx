'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserMinus, Flag } from 'lucide-react';
import { removeFriend } from '@/app/actions/friends';
import type { Friendship } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';

interface ProfileOptionsMenuProps {
    targetUserId: string;
    friendship: Friendship | null;
}

export function ProfileOptionsMenu({
    targetUserId,
    friendship,
}: ProfileOptionsMenuProps) {
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();
    const [localFriendship, setLocalFriendship] = useState<Friendship | null>(
        friendship
    );

    const handleRemove = () => {
        if (!localFriendship) return;
        const snapshot = localFriendship;
        startTransition(async () => {
            try {
                await removeFriend(localFriendship.id, targetUserId);
                setLocalFriendship(null);
                toast.success(t.profile.friendRemovedToast);
            } catch {
                setLocalFriendship(snapshot);
                toast.error(t.common.actionError);
            }
        });
    };

    const handleReport = () => toast.success(t.profile.reportSentToast);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t.profile.friendOptions}
                    disabled={isPending}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {localFriendship?.status === 'accepted' && (
                    <>
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={isPending}
                        >
                            <UserMinus className="h-4 w-4 mr-2" />
                            {t.profile.removeFriend}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem onClick={handleReport}>
                    <Flag className="h-4 w-4 mr-2" />
                    {t.profile.reportUser}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
