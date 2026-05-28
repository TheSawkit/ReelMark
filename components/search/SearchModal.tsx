'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search/SearchBar';
import { useTranslation } from '@/lib/i18n/context';

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-muted hover:text-text transition-colors"
        aria-label={t.common.search}
      >
        <Search className="h-5 w-5" />
      </Button>

      {typeof window !== 'undefined' &&
        isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-101 flex items-start justify-center pt-32 px-6 pointer-events-none"
              style={{
                animation: 'slideInFromTop var(--duration-base) ease-out',
              }}
            >
              <div className="w-full max-w-3xl relative pointer-events-auto">
                <SearchBar onClose={() => setIsOpen(false)} autoFocus />
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
