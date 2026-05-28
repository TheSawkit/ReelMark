import { cn } from '@/lib/utils';

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('rounded-md bg-surface-2 animate-shimmer', className)}
            style={{
                backgroundImage: `linear-gradient(90deg, var(--color-surface-2) 0%, var(--color-surface-3) 50%, var(--color-surface-2) 100%)`,
                backgroundSize: '200% 100%',
            }}
            {...props}
        />
    );
}
