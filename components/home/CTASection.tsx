import Link from 'next/link';
import { Play } from 'lucide-react';
import { getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';
import { Aurora } from '@/components/effects/Aurora';
import { Grain } from '@/components/effects/Grain';
import { GlowBorder } from '@/components/effects/GlowBorder';

export default async function CTASection({ lang }: { lang: Language }) {
	const t = await getTranslations(lang);

	return (
		<section className="px-6 py-24 lg:px-12">
			<div className="glass-surface relative mx-auto max-w-4xl overflow-hidden rounded-3xl border-glass-border-hover p-12 text-center shadow-card-lift md:p-16">
				<Aurora intensity={0.45} />
				<Grain opacity={0.06} />
				<div className="absolute inset-0 bg-linear-to-t from-background/40 to-transparent" />

				<div className="relative z-10">
					<h2 className="mb-6 heading-display leading-none text-4xl text-text md:text-6xl">
						{t.home.cta.title}
					</h2>
					<p className="mx-auto mb-10 max-w-xl text-lg text-muted md:text-xl">
						{t.home.cta.subtitle}
					</p>

					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Link
							href={localizedHref(lang, '/signup')}
							className="group/cta rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							<GlowBorder radius="var(--radius-2xl)">
								<span className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-lg font-bold text-black transition-transform duration-(--duration-fast) ease-apple group-hover/cta:scale-[1.02]">
									<Play className="h-5 w-5 fill-current" />
									{t.home.cta.button}
								</span>
							</GlowBorder>
						</Link>

						<Link
							href={localizedHref(lang, '/login')}
							className="glass-surface inline-flex h-14 items-center justify-center rounded-2xl px-8 text-lg font-semibold text-text transition-colors duration-(--duration-fast) ease-apple hover:bg-glass-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							{t.home.cta.alreadyHave}
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
