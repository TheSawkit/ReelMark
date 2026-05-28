'use client';

import { useState, useTransition } from 'react';
import { Mail, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  acceptFriendRequest,
  rejectFriendRequest,
} from '@/app/actions/friends';
import { useTranslation } from '@/lib/i18n/context';
import type { Friendship, PendingRequestEntry } from '@/types/profile';

interface PendingInvitationsProps {
  requests: PendingRequestEntry[];
  onCountChange: (count: number) => void;
}

export function PendingInvitations({
  requests,
  onCountChange,
}: PendingInvitationsProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [pending, setPending] = useState(requests);
  const [isPending, startTransition] = useTransition();

  if (pending.length === 0) return null;

  const handleAccept = (friendship: Friendship) => {
    const snapshot = pending;
    const next = pending.filter((r) => r.friendship.id !== friendship.id);
    setPending(next);
    onCountChange(next.length);
    startTransition(async () => {
      try {
        await acceptFriendRequest(friendship.id, friendship.requester_id);
        toast.success(t.profile.requestAcceptedToast);
      } catch {
        setPending(snapshot);
        onCountChange(snapshot.length);
        toast.error(t.common.actionError);
      }
    });
  };

  const handleReject = (friendship: Friendship) => {
    const snapshot = pending;
    const next = pending.filter((r) => r.friendship.id !== friendship.id);
    setPending(next);
    onCountChange(next.length);
    startTransition(async () => {
      try {
        await rejectFriendRequest(friendship.id, friendship.requester_id);
        toast.success(t.profile.requestRejectedToast);
      } catch {
        setPending(snapshot);
        onCountChange(snapshot.length);
        toast.error(t.common.actionError);
      }
    });
  };

  return (
    <div className="bg-surface/60 backdrop-blur-xl backdrop-saturate-150 border border-border-subtle rounded-cinema shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-controls="pending-invitations-list"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2/50 active:scale-[0.99] transition-all duration-(--duration-fast) ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 text-gold-bright shrink-0" />
          <span className="text-sm font-medium text-text">
            {t.profile.pendingInvitations}
          </span>
          <span
            className="text-xs bg-red text-white px-1.5 py-0.5 rounded-full font-medium leading-none"
            aria-label={t.profile.pendingInvitationsAria}
          >
            {pending.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted transition-transform duration-(--duration-fast) ease-apple shrink-0',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      <div
        id="pending-invitations-list"
        className={cn(
          'overflow-hidden transition-all duration-(--duration-base) ease-apple',
          isExpanded
            ? 'max-h-160 opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none'
        )}
        aria-live="polite"
      >
        <div className="px-3 pb-3 space-y-2 border-t border-border-subtle pt-3">
          {pending.map(({ friendship, username, avatarUrl, fullName }) => {
            const displayName = fullName || username;
            return (
              <div
                key={friendship.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/60 border border-border-subtle"
              >
                <UserAvatar
                  picture={avatarUrl}
                  fullName={fullName}
                  email={username}
                  size={40}
                  className="rounded-full shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted truncate">@{username}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(friendship)}
                    disabled={isPending}
                    className="gap-1.5 h-8 px-3 text-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t.profile.acceptRequest}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(friendship)}
                    disabled={isPending}
                    className="h-8 px-3 text-xs"
                  >
                    {t.profile.rejectRequest}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
