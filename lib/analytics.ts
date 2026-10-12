export type ConversionEventName = 'phone_click' | 'quote_click' | 'form_start' | 'form_submit';

declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: ConversionEventName,
      parameters: { page_path: string; lang: string },
    ) => void;
  }
}

/** Siunčia konversijos įvykį tik po analitikos sutikimo. */
export function trackConversionEvent(eventName: ConversionEventName) {
  if (typeof window === 'undefined') return;

  try {
    if (window.localStorage.getItem('situacija-consent') !== 'granted') return;
  } catch {
    return;
  }

  if (typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, {
    page_path: window.location.pathname,
    lang: document.documentElement.lang,
  });
}
