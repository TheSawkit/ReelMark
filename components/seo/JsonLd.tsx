import { serializeJsonLd } from '@/lib/structured-data';

/** Emits schema.org structured data in the server HTML, where crawlers read it without running JS. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
		/>
	);
}
