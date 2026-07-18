import { Loader2, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionStatusIconProps {
	loading: boolean;
	error: boolean;
	icon: LucideIcon;
	className?: string;
}

/** Action-button icon that swaps to a spinner while pending and an error mark on failure. */
export function ActionStatusIcon({
	loading,
	error,
	icon,
	className = 'h-4 w-4',
}: ActionStatusIconProps) {
	const Icon = loading ? Loader2 : error ? XCircle : icon;
	return <Icon className={cn(className, loading && 'animate-spin')} />;
}
