import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'w-full min-w-0 rounded-(--radius-cinema) border border-border bg-surface px-3 py-2 text-base text-text shadow-card-xs transition-all duration-(--duration-fast) outline-none placeholder:text-muted resize-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				'focus-visible:border-red focus-visible:ring-[3px] focus-visible:ring-red/40',
				'aria-invalid:border-red aria-invalid:ring-red/20',
				className
			)}
			{...props}
		/>
	);
}

export { Textarea };
