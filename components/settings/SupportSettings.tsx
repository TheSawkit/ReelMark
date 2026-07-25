'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { DonateButton } from '@/components/support/DonateButton';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';

export function SupportSettings() {
	const { t, lang } = useTranslation();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Heart className="size-4 text-primary" aria-hidden />
					{t.support.card.title}
				</CardTitle>
				<CardDescription>{t.support.card.description}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-wrap items-center gap-4">
				<DonateButton label={t.support.cta} />
				<Link
					href={localizedHref(lang, '/support')}
					className="text-muted hover:text-text text-sm transition-colors"
				>
					{t.support.card.link}
				</Link>
			</CardContent>
		</Card>
	);
}
