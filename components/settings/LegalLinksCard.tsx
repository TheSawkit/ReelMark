'use client';

import Link from 'next/link';
import { FileText, ShieldCheck } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';

export function LegalLinksCard() {
	const { t, lang } = useTranslation();
	const td = t.settings.data;
	const legal = t.pages.legal;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{td.legalTitle}</CardTitle>
				<CardDescription>{td.legalDescription}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-wrap gap-2">
				<Button asChild variant="outline" className="gap-2">
					<Link href={localizedHref(lang, '/terms')}>
						<FileText className="h-4 w-4" />
						{legal.terms.title}
					</Link>
				</Button>
				<Button asChild variant="outline" className="gap-2">
					<Link href={localizedHref(lang, '/privacy')}>
						<ShieldCheck className="h-4 w-4" />
						{legal.privacy.title}
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
