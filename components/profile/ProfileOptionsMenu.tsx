'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useGuardedTransition } from '@/hooks/useGuardedTransition';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserMinus } from 'lucide-react';
import { removeFriend } from '@/app/actions/friends';
import type { Friendship } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';
import { toastActionError } from '@/lib/action-toast';

interface ProfileOptionsMenuProps {
	targetUserId: string;
	friendship: Friendship | null;
}

export function ProfileOptionsMenu({
	targetUserId,
	friendship,
}: ProfileOptionsMenuProps) {
	const { t } = useTranslation();
	const [isPending, startTransition] = useGuardedTransition();
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
			} catch (err) {
				setLocalFriendship(snapshot);
				toastActionError(err, t.common.actionError);
			}
		});
	};

	if (localFriendship?.status !== 'accepted') return null;

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
				<DropdownMenuItem
					variant="destructive"
					onClick={handleRemove}
					disabled={isPending}
				>
					<UserMinus className="h-4 w-4 mr-2" />
					{t.profile.removeFriend}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
