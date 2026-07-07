import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
	children: React.ReactNode;
	className?: string;
}

/** Centered page wrapper with consistent horizontal and vertical padding. */
export function PageLayout({ children, className }: PageLayoutProps) {
	return (
		<div
			className={cn(
				'container mx-auto py-12 md:py-16 lg:py-20 px-6 lg:px-12',
				className
			)}
		>
			{children}
		</div>
	);
}

interface PageHeaderProps {
	title: string;
	subtitle?: ReactNode;
}

/** Animated page header with a title and an optional subtitle. */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
	return (
		<div className="mb-12 md:mb-16 animate-slide-up-subtle">
			<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-text tracking-tight">
				{title}
			</h1>
			{subtitle && <p className="text-muted text-lg">{subtitle}</p>}
		</div>
	);
}
