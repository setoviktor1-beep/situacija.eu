import type { NextConfig } from 'next';

const directusHost = new URL(
  process.env.DIRECTUS_PUBLIC_URL || 'https://situacija.sitestudio.lt',
).hostname;

/**
 * Turinio saugumo politika. Leidžiama tik tai, ką svetainė realiai naudoja:
 * Google Analytics, OpenStreetMap kaladėlės ir Directus nuotraukos.
 * 'unsafe-inline' skriptams būtinas Next.js hidratacijos ir Consent Mode kodui.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${directusHost} https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://www.google-analytics.com https://www.googletagmanager.com`,
  "font-src 'self' data:",
  `connect-src 'self' https://${directusHost} https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [{ protocol: 'https', hostname: directusHost, pathname: '/assets/**' }],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Audito P1 #5
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        // Nuotraukos ir šriftai keičiasi retai — ilgas kešas su versijavimu
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  async redirects() {
    return [
      // Audito P1 #8 — /index.html dubliavo pagrindinį puslapį su 200 atsaku
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/pl/index.html', destination: '/pl/', permanent: true },
      { source: '/ru/index.html', destination: '/ru/', permanent: true },
      // Vieša CRM nuoroda pašalinta iš poraštės (P0 #3); senos nuorodos nukreipiamos
      { source: '/crm.html', destination: '/', permanent: true },
      { source: '/pl/crm.html', destination: '/pl/', permanent: true },
      { source: '/ru/crm.html', destination: '/ru/', permanent: true },
    ];
  },
};

export default nextConfig;
