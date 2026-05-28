'use client';

import { usePathname } from 'next/navigation';
import CinemaSpotlight from '@/components/ui/cinema-spotlight';

export default function CinemaSpotlightWrapper() {
  const pathname = usePathname();

  if (pathname?.startsWith('/movie') || pathname?.startsWith('/tv')) {
    return null;
  }

  return <CinemaSpotlight />;
}
