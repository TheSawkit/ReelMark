'use client';

import { useState, useId } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function StarRating({
  value,
  onChange,
  size = 'md',
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const uid = useId();

  const interactive = !!onChange;
  const displayValue = hovered ?? value;

  function getStarFill(starIndex: number): 'full' | 'half' | 'empty' {
    if (displayValue === null) return 'empty';
    const threshold = starIndex * 2;
    if (displayValue >= threshold) return 'full';
    if (displayValue >= threshold - 1) return 'half';
    return 'empty';
  }

  function handleMouseMove(
    e: React.MouseEvent<SVGSVGElement>,
    starIndex: number
  ) {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHovered(
      e.clientX - rect.left < rect.width / 2 ? starIndex * 2 - 1 : starIndex * 2
    );
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>, starIndex: number) {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onChange?.(
      e.clientX - rect.left < rect.width / 2 ? starIndex * 2 - 1 : starIndex * 2
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!interactive) return;
    const current = value ?? 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange?.(Math.min(10, current + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange?.(Math.max(1, current - 1));
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        interactive &&
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm',
        className
      )}
      role={interactive ? 'slider' : undefined}
      aria-valuenow={interactive ? (value ?? 0) : undefined}
      aria-valuemin={interactive ? 1 : undefined}
      aria-valuemax={interactive ? 10 : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onMouseLeave={() => interactive && setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fill = getStarFill(starIndex);
        const id = `${uid}-s${starIndex}`;
        return (
          <svg
            key={starIndex}
            className={cn(
              SIZES[size],
              interactive &&
                'cursor-pointer transition-transform hover:scale-110',
              'shrink-0'
            )}
            viewBox="0 0 24 24"
            onMouseMove={
              interactive ? (e) => handleMouseMove(e, starIndex) : undefined
            }
            onClick={interactive ? (e) => handleClick(e, starIndex) : undefined}
          >
            <defs>
              <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="var(--color-gold)" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={
                fill === 'full'
                  ? 'var(--color-gold)'
                  : fill === 'half'
                    ? `url(#${id})`
                    : 'transparent'
              }
              stroke="var(--color-gold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}
