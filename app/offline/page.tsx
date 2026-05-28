'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: 'PREFETCH_OFFLINE_PAGE' });
  });
}

export default function OfflinePage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1>{t.offline.title}</h1>
      <p>{t.offline.description}</p>
      <Button onClick={() => window.location.reload()}>
        {t.offline.retry}
      </Button>
    </div>
  );
}
