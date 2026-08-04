'use client';

import { LegalLinksCard } from '@/components/settings/LegalLinksCard';
import { ExportDataCard } from '@/components/settings/ExportDataCard';
import { ImportDataCard } from '@/components/settings/ImportDataCard';

export function DataSettings() {
	return (
		<div className="space-y-4">
			<LegalLinksCard />
			<ExportDataCard />
			<ImportDataCard />
		</div>
	);
}
