import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-cinema text-sm font-semibold transition-all duration-(--duration-fast) ease-apple transform hover:scale-105 active:scale-97 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	{
		variants: {
			variant: {
				default: 'bg-red text-white hover:bg-red-2 shadow-cinema',
				destructive:
					'bg-red text-white hover:bg-red-2 border-2 border-transparent',
				outline:
					'border border-border bg-surface text-text hover:bg-surface-2',
				secondary: 'bg-surface-2 text-text hover:bg-surface',
				ghost: 'hover:bg-surface-2/80 text-text',
				link: 'text-red underline-offset-4 hover:underline',
			},
			size: {
				default: 'px-5 py-2.5 has-[>svg]:px-4',
				sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'px-8 py-3 has-[>svg]:px-6',
				icon: 'size-11',
				'icon-sm': 'size-9',
				'icon-lg': 'size-12',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

function Button({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	loading = false,
	disabled,
	children,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		loading?: boolean;
	}) {
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			data-loading={loading || undefined}
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled || loading}
			{...props}
		>
			{asChild ? (
				children
			) : (
				<>
					{loading && (
						<Loader2 className="animate-spin" aria-hidden />
					)}
					{children}
				</>
			)}
		</Comp>
	);
}

export { Button, buttonVariants };
