'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteIconButtonProps {
	onClick: () => void;
	disabled?: boolean;
	ariaLabel: string;
}

export function DeleteIconButton({
	onClick,
	disabled,
	ariaLabel,
}: DeleteIconButtonProps) {
	return (
		<Button
			variant="ghost"
			size="sm"
			disabled={disabled}
			onClick={onClick}
			className="shrink-0 h-8 w-8 p-0 text-muted hover:text-red"
			aria-label={ariaLabel}
		>
			<Trash2 className="h-4 w-4" />
		</Button>
	);
}
