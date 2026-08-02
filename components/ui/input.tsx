import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'h-9 w-full min-w-0 rounded-(--radius-cinema) border border-border bg-surface px-3 py-1 text-base text-text shadow-card-xs transition duration-(--duration-fast) outline-none placeholder:text-muted selection:bg-red selection:text-text file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				'focus-visible:border-red focus-visible:ring-[3px] focus-visible:ring-red/40',
				'aria-invalid:border-red aria-invalid:ring-red/20',
				className
			)}
			{...props}
		/>
	);
}

export { Input };
