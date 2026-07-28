'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useGuardedTransition } from '@/hooks/useGuardedTransition';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Clock, Check } from 'lucide-react';
import {
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	cancelFriendRequest,
} from '@/app/actions/friends';
import { createClient } from '@/lib/supabase/client';
import { RATE_LIMITED } from '@/lib/action-errors';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Friendship } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';

interface FriendshipButtonProps {
	targetUserId: string;
	currentUserId: string;
	friendship: Friendship | null;
}

export function FriendshipButton({
	targetUserId,
	currentUserId,
	friendship,
}: FriendshipButtonProps) {
	const { t } = useTranslation();
	const [isPending, startTransition] = useGuardedTransition();
	const [localFriendship, setLocalFriendship] = useState<Friendship | null>(
		friendship
	);
	const supabase = useMemo(() => createClient(), []);

	useEffect(() => {
		const applyChange = (
			payload: RealtimePostgresChangesPayload<Friendship>
		) => {
			if (payload.eventType === 'DELETE') {
				const deletedId = payload.old.id;
				setLocalFriendship((prev) =>
					prev && prev.id === deletedId ? null : prev
				);
				return;
			}
			const row = payload.new;
			if (
				row.requester_id !== targetUserId &&
				row.addressee_id !== targetUserId
			)
				return;
			setLocalFriendship(row);
		};

		const channel = supabase
			.channel(`friendship-${currentUserId}`)
			.on<Friendship>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'friendships',
					filter: `requester_id=eq.${currentUserId}`,
				},
				applyChange
			)
			.on<Friendship>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'friendships',
					filter: `addressee_id=eq.${currentUserId}`,
				},
				applyChange
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [currentUserId, targetUserId, supabase]);

	const handleSendRequest = () => {
		startTransition(async () => {
			try {
				await sendFriendRequest(targetUserId);
				setLocalFriendship({
					id: crypto.randomUUID(),
					requester_id: currentUserId,
					addressee_id: targetUserId,
					status: 'pending',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				});
				toast.success(t.profile.requestSentToast);
			} catch (err) {
				const msg = err instanceof Error ? err.message : '';
				if (msg === 'SELF_REQUEST')
					toast.error(t.profile.errors.selfRequest);
				else if (msg === 'DUPLICATE_REQUEST')
					toast.error(t.profile.errors.duplicateRequest);
				else if (msg === RATE_LIMITED)
					toast.error(t.profile.errors.rateLimited);
				else toast.error(t.common.actionError);
			}
		});
	};

	const handleAccept = () => {
		if (!localFriendship) return;
		const snapshot = localFriendship;
		startTransition(async () => {
			try {
				await acceptFriendRequest(
					localFriendship.id,
					localFriendship.requester_id
				);
				setLocalFriendship({ ...localFriendship, status: 'accepted' });
				toast.success(t.profile.requestAcceptedToast);
			} catch {
				setLocalFriendship(snapshot);
				toast.error(t.common.actionError);
			}
		});
	};

	const handleCancelRequest = () => {
		if (!localFriendship) return;
		const snapshot = localFriendship;
		startTransition(async () => {
			try {
				await cancelFriendRequest(localFriendship.id, targetUserId);
				setLocalFriendship(null);
				toast.success(t.profile.requestCancelledToast);
			} catch {
				setLocalFriendship(snapshot);
				toast.error(t.common.actionError);
			}
		});
	};

	const handleReject = () => {
		if (!localFriendship) return;
		const snapshot = localFriendship;
		startTransition(async () => {
			try {
				await rejectFriendRequest(
					localFriendship.id,
					localFriendship.requester_id
				);
				setLocalFriendship(null);
				toast.success(t.profile.requestRejectedToast);
			} catch {
				setLocalFriendship(snapshot);
				toast.error(t.common.actionError);
			}
		});
	};

	if (!localFriendship) {
		return (
			<Button
				size="sm"
				onClick={handleSendRequest}
				disabled={isPending}
				className="gap-2"
			>
				<UserPlus className="h-4 w-4" />
				{t.profile.addFriend}
			</Button>
		);
	}

	if (localFriendship.status === 'accepted') {
		return null;
	}

	if (
		localFriendship.status === 'pending' &&
		localFriendship.requester_id === currentUserId
	) {
		return (
			<Button
				size="sm"
				variant="outline"
				onClick={handleCancelRequest}
				disabled={isPending}
				className="gap-2"
			>
				<Clock className="h-4 w-4" />
				{t.profile.requestSent}
			</Button>
		);
	}

	if (
		localFriendship.status === 'pending' &&
		localFriendship.addressee_id === currentUserId
	) {
		return (
			<div className="flex-1 flex items-center justify-between gap-3 px-4 py-3 glass-surface rounded-cinema shadow-card">
				<div className="flex items-center gap-2.5">
					<UserCheck className="h-4 w-4 text-gold-bright shrink-0" />
					<span className="text-sm font-medium text-text">
						{t.profile.friendRequestReceived}
					</span>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					<Button
						size="sm"
						onClick={handleAccept}
						disabled={isPending}
						className="gap-1.5"
					>
						<Check className="h-3.5 w-3.5" />
						{t.profile.acceptRequest}
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={handleReject}
						disabled={isPending}
					>
						{t.profile.rejectRequest}
					</Button>
				</div>
			</div>
		);
	}

	return null;
}
