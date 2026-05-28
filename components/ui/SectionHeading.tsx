import { cn } from '@/lib/utils';

interface SectionHeadingProps {
	children: React.ReactNode;
	className?: string;
}

/** Section heading with a decorative primary accent bar on the left. */
export function SectionHeading({ children, className }: SectionHeadingProps) {
	return (
		<h2
			className={cn(
				'text-xl font-bold text-text-main flex items-center gap-3 tracking-tight',
				className
			)}
		>
			<div
				className="w-1 h-6 bg-primary rounded-full shrink-0"
				aria-hidden="true"
			/>
			{children}
		</h2>
	);
}
