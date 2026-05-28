'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'bg-surface border border-border-subtle shadow-card text-text text-sm rounded-xl',
          description: 'text-muted text-xs',
          error: 'bg-surface border-red/30 text-text',
          success: 'bg-surface border-primary/30 text-text',
          actionButton: 'bg-primary text-white',
          cancelButton: 'bg-surface-2 text-muted',
          closeButton: 'bg-surface-2 text-muted hover:text-text',
        },
      }}
      closeButton
    />
  );
}
