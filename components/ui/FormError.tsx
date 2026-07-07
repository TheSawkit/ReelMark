import { cn } from '@/lib/utils';

interface FormErrorProps {
	children: React.ReactNode;
	className?: string;
}

/** Centered inline form error message, announced to screen readers. */
export function FormError({ children, className }: FormErrorProps) {
	return (
		<p
			role="alert"
			className={cn('text-sm text-red-2 text-center', className)}
		>
			{children}
		</p>
	);
}
