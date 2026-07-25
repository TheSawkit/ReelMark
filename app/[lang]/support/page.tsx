import type { Metadata } from 'next';
import { Database, Film, Globe, Server } from 'lucide-react';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { DonateButton } from '@/components/support/DonateButton';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

interface SupportPageProps {
	params: Promise<{ lang: Language }>;
}

export async function generateMetadata({
	params,
}: SupportPageProps): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return buildPageMetadata(t.support.title, t.support.subtitle);
}

export default async function SupportPage({ params }: SupportPageProps) {
	const { lang } = await params;
	const t = await getTranslations(lang);

	const costs = [
		{ icon: Server, label: t.support.costs.hosting },
		{ icon: Database, label: t.support.costs.database },
		{ icon: Film, label: t.support.costs.apis },
		{ icon: Globe, label: t.support.costs.domain },
	];

	return (
		<PageLayout>
			<article className="mx-auto max-w-3xl pb-16">
				<PageHeader
					title={t.support.title}
					subtitle={t.support.subtitle}
				/>
				<p className="text-text leading-relaxed mb-10">
					{t.support.intro}
				</p>

				<section className="mb-10">
					<h2 className="text-xl font-bold text-text mb-4">
						{t.support.costsTitle}
					</h2>
					<ul className="grid gap-3 sm:grid-cols-2">
						{costs.map(({ icon: Icon, label }) => (
							<li
								key={label}
								className="glass-surface flex items-center gap-3 rounded-lg px-4 py-3 text-muted"
							>
								<Icon
									className="size-5 shrink-0 text-primary"
									aria-hidden
								/>
								<span>{label}</span>
							</li>
						))}
					</ul>
				</section>

				<section className="mb-10">
					<h2 className="text-xl font-bold text-text mb-3">
						{t.support.noPerksTitle}
					</h2>
					<p className="text-muted leading-relaxed">
						{t.support.noPerksBody}
					</p>
				</section>

				<section className="glass-surface rounded-2xl p-8 text-center">
					<DonateButton label={t.support.cta} size="lg" />
					<p className="text-muted text-sm mx-auto mt-6 max-w-md">
						{t.support.ctaNote}
					</p>
					<p className="text-muted text-sm mt-3">
						{t.support.thanks}
					</p>
				</section>
			</article>
		</PageLayout>
	);
}
