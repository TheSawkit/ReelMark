'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
    const pathname = usePathname();
    const isPopRef = useRef(false);

    useEffect(() => {
        const onPopState = () => {
            isPopRef.current = true;
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        if (isPopRef.current) {
            isPopRef.current = false;
            return;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);

    return null;
}
