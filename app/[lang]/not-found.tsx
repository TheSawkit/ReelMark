import Link from 'next/link';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTranslations, getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';

export default async function NotFound() {
	const [t, lang] = await Promise.all([
		getTranslations(),
		getServerLanguage(),
	]);

	return (
		<div className="centered-section">
			<div className="max-w-md w-full text-center space-y-6 glass-surface rounded-(--radius-xl) shadow-cinema p-8 animate-scale-in">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/15 text-primary mb-4">
					<Film className="w-10 h-10" />
				</div>

				<div>
					<p className="text-6xl font-bold text-primary mb-2">404</p>
					<h1 className="text-2xl font-bold text-text">
						{t.common.notFoundTitle}
					</h1>
					<p className="text-muted mt-2">
						{t.common.notFoundDescription}
					</p>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
					<Button asChild className="w-full sm:w-auto min-w-35">
						<Link href={localizedHref(lang, '/')}>
							{t.common.errorBackHome}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
