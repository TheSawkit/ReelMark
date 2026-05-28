'use client';

import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { VISIBILITY_ICON } from '@/lib/visibility-ui';
import type { PrivacyVisibility } from '@/types/profile';

interface VisibilitySelectorProps {
  value: PrivacyVisibility;
  onChange: (v: PrivacyVisibility) => void;
  name?: string;
}

export function VisibilitySelector({
  value,
  onChange,
  name = 'visibility',
}: VisibilitySelectorProps) {
  const { t } = useTranslation();

  const options: Array<{ value: PrivacyVisibility; label: string }> = [
    { value: 'public', label: t.settings.privacy.public },
    { value: 'friends', label: t.settings.privacy.friendsOnly },
    { value: 'private', label: t.settings.privacy.private },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const Icon = VISIBILITY_ICON[opt.value];
        return (
          <label key={opt.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only peer"
            />
            <span
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer select-none',
                'border-border-subtle bg-surface-2 text-muted',
                'peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-text',
                'hover:bg-surface'
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="font-medium">{opt.label}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
