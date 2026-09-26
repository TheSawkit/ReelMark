import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { riseStyle } from '@/lib/motion';

interface PageLayoutProps {
	children: React.ReactNode;
	className?: string;
}

/** Centered page wrapper with consistent horizontal and vertical padding. */
export function PageLayout({ children, className }: PageLayoutProps) {
	return (
		<div
			className={cn(
				'container mx-auto py-section md:py-section-md lg:py-section-lg px-6 lg:px-12',
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

/** Native large title (display face) with an optional subtitle, rising in like the heroes. */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
	return (
		<div className="mb-12 md:mb-16">
			<h1
				className="hero-rise heading-display text-5xl leading-none text-text md:text-6xl lg:text-7xl"
				style={riseStyle(0)}
			>
				{title}
			</h1>
			{subtitle && (
				<p
					className="hero-rise mt-3 text-base text-muted md:text-lg"
					style={riseStyle(1)}
				>
					{subtitle}
				</p>
			)}
		</div>
	);
}

interface PageHeaderSkeletonProps {
	subtitle?: boolean;
	titleWrapsOnMobile?: boolean;
	subtitleWrapsOnMobile?: boolean;
}

/** PageHeader placeholder built on the same line boxes, so the page doesn't move when the real header lands. */
export function PageHeaderSkeleton({
	subtitle = true,
	titleWrapsOnMobile = false,
	subtitleWrapsOnMobile = false,
}: PageHeaderSkeletonProps) {
	return (
		<div className="mb-12 md:mb-16">
			<div className="flex h-12 items-center md:h-15 lg:h-18">
				<Skeleton className="h-10 w-56 max-w-full rounded-lg md:h-12 lg:h-14" />
			</div>
			{titleWrapsOnMobile && (
				<div className="flex h-12 items-center sm:hidden">
					<Skeleton className="h-10 w-40 rounded-lg" />
				</div>
			)}
			{subtitle && (
				<div className="mt-3">
					<div className="flex h-6 items-center md:h-7">
						<Skeleton className="h-4 w-80 max-w-full rounded md:h-5" />
					</div>
					{subtitleWrapsOnMobile && (
						<div className="flex h-6 items-center sm:hidden">
							<Skeleton className="h-4 w-40 rounded" />
						</div>
					)}
				</div>
			)}
		</div>
	);
}
