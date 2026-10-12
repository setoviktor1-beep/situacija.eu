'use client';

import { useEffect } from 'react';
import { trackConversionEvent } from '@/lib/analytics';

/** Deleguotai fiksuoja visus telefono ir pažymėtų sąmatos CTA paspaudimus. */
export function ConversionEventTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest('a');
      if (!anchor) return;

      if (anchor.getAttribute('href')?.trim().toLowerCase().startsWith('tel:')) {
        trackConversionEvent('phone_click');
      } else if (anchor.dataset.conversionEvent === 'quote_click') {
        trackConversionEvent('quote_click');
      }
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
