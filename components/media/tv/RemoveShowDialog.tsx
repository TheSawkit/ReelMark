'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n/context';

interface RemoveShowDialogProps {
	showTitle: string;
	onConfirm: () => void;
	onClose: () => void;
}

/** Confirms removing a show from the watchlist — the removal also erases its whole episode history. */
export function RemoveShowDialog({
	showTitle,
	onConfirm,
	onClose,
}: RemoveShowDialogProps) {
	const { t } = useTranslation();

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t.movie.removeShowTitle}</DialogTitle>
					<DialogDescription>{showTitle}</DialogDescription>
				</DialogHeader>
				<p className="px-5 py-4 text-sm text-muted">
					{t.movie.removeShowDescription}
				</p>
				<div className="flex justify-end gap-2 px-5 pb-5">
					<Button variant="ghost" size="sm" onClick={onClose}>
						{t.common.cancel}
					</Button>
					<Button size="sm" onClick={onConfirm}>
						{t.movie.removeShowConfirm}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
