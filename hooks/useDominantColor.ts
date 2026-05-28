'use client';

import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

type IgnoredColor = [number, number, number, number, number];

const IGNORED_DOMINANT_COLORS: IgnoredColor[] = [
  [255, 255, 255, 255, 10],
  [10, 10, 10, 255, 20],
  [20, 20, 20, 255, 20],
  [30, 30, 30, 255, 20],
  [40, 40, 40, 255, 20],
  [50, 50, 50, 255, 20],
  [60, 60, 60, 255, 20],
  [70, 70, 70, 255, 20],
  [80, 80, 80, 255, 20],
  [90, 90, 90, 255, 20],
  [100, 100, 100, 255, 20],
];

export function useDominantColor(imageUrl: string | null) {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const extractColor = async () => {
      try {
        const fac = new FastAverageColor();
        const result = await fac.getColorAsync(imageUrl, {
          ignoredColor: IGNORED_DOMINANT_COLORS,
          algorithm: 'dominant',
        });
        setColor(result.hex);
      } catch {
        setColor(null);
      }
    };

    extractColor();
  }, [imageUrl]);

  return color;
}
