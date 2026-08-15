'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { SERVICE_AREAS } from '@/content/site';
import type { Locale } from '@/content/types';
import { getUi } from '@/content/ui';

/**
 * Veiklos teritorijų žemėlapis ant OpenStreetMap.
 * Leaflet įkeliamas dinamiškai tik tada, kai žemėlapis priartėja prie ekrano —
 * taip jis nepatenka į pradinį JS paketą (audito P1 #4 dėl svorio).
 *
 * Tekstinis vietovių sąrašas renderinamas serveryje atskirai (žr. RegionsSection),
 * kad turinys būtų pasiekiamas robotams ir be JavaScript.
 */
export function ServiceAreaMap({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Įkeliam tik priartėjus — 400px atsarga, kad spėtų užsikrauti
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let map: import('leaflet').Map | null = null;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        // Ratukas nezoomina iš karto — kad puslapio slinkimas neužstrigtų
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      for (const area of SERVICE_AREAS) {
        const color = area.primary ? '#0f766e' : '#b9663c';

        L.circle([area.lat, area.lng], {
          radius: area.radiusKm * 1000,
          color,
          weight: 2,
          opacity: 0.75,
          fillColor: color,
          fillOpacity: area.primary ? 0.14 : 0.08,
          // Antrinė zona – brūkšninė riba, nes tai „pagal susitarimą"
          dashArray: area.primary ? undefined : '6 6',
        }).addTo(map);

        const marker = L.marker([area.lat, area.lng], {
          icon: L.divIcon({
            className: '',
            html: `<span style="display:flex;align-items:center;justify-content:center;width:1.5rem;height:1.5rem;border-radius:9999px;background:${color};color:#fff;font-weight:700;font-size:11px;box-shadow:0 2px 8px rgba(6,11,20,.35);border:2px solid #fff">${area.primary ? '★' : '·'}</span>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
          keyboard: true,
          title: area.name[locale],
        }).addTo(map);

        marker.bindPopup(
          `<strong>${area.name[locale]}</strong><br>${area.note[locale]}`,
        );

        bounds.extend([area.lat, area.lng]);
      }

      map.fitBounds(bounds, { padding: [48, 48] });

      // Ratuko zoomas įjungiamas tik spustelėjus žemėlapį
      map.on('click', () => map?.scrollWheelZoom.enable());
      map.on('mouseout', () => map?.scrollWheelZoom.disable());
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [visible, locale]);

  return (
    <div className="overflow-hidden rounded-tile ring-1 ring-ink-100 shadow-tile">
      <div
        ref={containerRef}
        role="application"
        aria-label={ui.map.heading}
        className="h-[420px] w-full bg-ink-50 md:h-[520px]"
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 bg-white px-5 py-4 text-sm text-ink-600">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full bg-brand-700"
            aria-hidden="true"
          />
          {ui.map.primaryLegend}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full border-2 border-dashed border-clay-500"
            aria-hidden="true"
          />
          {ui.map.secondaryLegend}
        </span>
      </div>
    </div>
  );
}
