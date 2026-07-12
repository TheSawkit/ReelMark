import { PageLayout, PageHeader } from '@/components/layout/PageLayout';

interface LegalContent {
	title: string;
	updated: string;
	intro: string;
	sections: ReadonlyArray<{
		title: string;
		body: readonly string[];
	}>;
}

/** Renders a legal document (privacy policy, terms) from its i18n content. */
export function LegalArticle({ content }: { content: LegalContent }) {
	return (
		<PageLayout>
			<article className="mx-auto max-w-3xl pb-16">
				<PageHeader title={content.title} subtitle={content.updated} />
				<p className="text-text leading-relaxed mb-10">
					{content.intro}
				</p>
				{content.sections.map((section) => (
					<section key={section.title} className="mb-8">
						<h2 className="text-xl font-bold text-text mb-3">
							{section.title}
						</h2>
						{section.body.map((paragraph) => (
							<p
								key={paragraph}
								className="text-muted leading-relaxed mb-3"
							>
								{paragraph}
							</p>
						))}
					</section>
				))}
			</article>
		</PageLayout>
	);
}
