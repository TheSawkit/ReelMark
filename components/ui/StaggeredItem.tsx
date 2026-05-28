import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StaggeredItemProps {
  index: number;
  staggerMs?: number;
  animation?: string;
  duration?: string;
  className?: string;
  children: ReactNode;
  eager?: boolean;
}

/** Animates children in with a per-index delay, creating a staggered cascade effect on mount. */
export function StaggeredItem({
  index,
  staggerMs = 50,
  animation = 'slideUp',
  duration = 'var(--duration-slow)',
  className,
  children,
  eager,
}: StaggeredItemProps) {
  return (
    <div
      className={cn(className)}
      style={
        eager
          ? {
              animation: `${animation} ${duration} ease-out both`,
              animationDelay: `${index * staggerMs}ms`,
            }
          : {
              animation: `${animation} ${duration} ease-out forwards`,
              animationDelay: `${index * staggerMs}ms`,
              opacity: 0,
            }
      }
    >
      {children}
    </div>
  );
}
