import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
	children: React.ReactNode;
	href?: string;
	className?: string;
}

const ACCENT_BAR = (
	<div
		className="w-1 h-6 bg-primary rounded-full shrink-0"
		aria-hidden="true"
	/>
);

/**
 * Canonical section heading: primary accent bar + title, used for every section.
 * Pass `href` to make it a "view all" link (adds an arrow on hover).
 */
export function SectionHeading({
	children,
	href,
	className,
}: SectionHeadingProps) {
	if (href) {
		return (
			<Link
				href={href}
				className="group/section inline-flex items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
			>
				{ACCENT_BAR}
				<h2
					className={cn(
						'text-xl font-bold text-text-main tracking-tight transition-colors duration-(--duration-medium) ease-apple group-hover/section:text-gold',
						className
					)}
				>
					{children}
				</h2>
				<ArrowRight className="w-5 h-5 shrink-0 text-gold opacity-0 -translate-x-3 transition-all duration-(--duration-medium) ease-apple group-hover/section:opacity-100 group-hover/section:translate-x-0" />
			</Link>
		);
	}

	return (
		<h2
			className={cn(
				'text-xl font-bold text-text-main flex items-center gap-3 tracking-tight',
				className
			)}
		>
			{ACCENT_BAR}
			{children}
		</h2>
	);
}
