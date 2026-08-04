'use client';

import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGuardedTransition } from '@/hooks/useGuardedTransition';
import { useTranslation } from '@/lib/i18n/context';
import { exportUserData } from '@/app/actions/data';
import { RATE_LIMITED } from '@/lib/action-errors';

function downloadJson(data: unknown, filename: string) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: 'application/json',
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

export function ExportDataCard() {
	const { t } = useTranslation();
	const td = t.settings.data;
	const [isExporting, startExport] = useGuardedTransition();

	function handleExport() {
		startExport(async () => {
			try {
				const data = await exportUserData();
				const day = new Date().toISOString().split('T')[0];
				downloadJson(data, `reelmark-export-${day}.json`);
				toast.success(td.exportSuccess);
			} catch (err) {
				const message = err instanceof Error ? err.message : '';
				toast.error(
					message === RATE_LIMITED
						? td.exportRateLimited
						: t.common.actionError
				);
			}
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{td.exportTitle}</CardTitle>
				<CardDescription>{td.exportDescription}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					onClick={handleExport}
					loading={isExporting}
					variant="outline"
					className="gap-2"
				>
					<Upload className="h-4 w-4" />
					{td.exportButton}
				</Button>
			</CardContent>
		</Card>
	);
}
