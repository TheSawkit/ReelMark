'use client';

import { WifiOff } from 'lucide-react';
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
		<div className="centered-section">
			<div className="max-w-md w-full text-center space-y-6 glass-surface rounded-(--radius-xl) shadow-card-lift p-8 animate-scale-in">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/15 text-primary mb-4">
					<WifiOff className="w-10 h-10" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-text">
						{t.offline.title}
					</h1>
					<p className="text-muted mt-2">{t.offline.description}</p>
				</div>
				<Button
					onClick={() => window.location.reload()}
					className="w-full sm:w-auto min-w-35"
				>
					{t.offline.retry}
				</Button>
			</div>
		</div>
	);
}
