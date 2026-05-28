import { cn } from '@/lib/utils';

interface ProgressBarProps {
    watched: number;
    total: number;
    className?: string;
    innerClassName?: string;
}

export function ProgressBar({
    watched,
    total,
    className,
    innerClassName,
}: ProgressBarProps) {
    const percentage = Math.min(
        100,
        Math.round((watched / Math.max(1, total)) * 100)
    );

    return (
        <div className={cn('overflow-hidden', className)}>
            <div
                className={cn(
                    'h-full bg-red transition-all duration-(--duration-slow) ease-out',
                    innerClassName
                )}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
