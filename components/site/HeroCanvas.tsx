'use client';

import { useEffect, useRef } from 'react';

/**
 * Hero animacija: plytelės klojamos įstrižaine banga, per jas slenka
 * lazerinio nivelyro linija — tiesioginė nuoroda į meistro darbo metodą
 * (TLS lyginimo sistema ir lazerinis nivelyras minimi svetainės turinyje).
 *
 * Elgsena:
 * - prefers-reduced-motion: piešiamas statiškas galutinis kadras, be ciklo;
 * - už ekrano ribų animacija stabdoma (neeikvoja baterijos);
 * - DPR-aware, todėl linijos lieka aiškios Retina ekranuose.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    let startTime = performance.now();

    const TILE = 92; // plytelės kraštinė, px
    const GROUT = 6; // siūlės plotis, px
    const WAVE_MS = 5200; // vienos bangos trukmė
    const PAUSE_MS = 1400; // pauzė tarp bangų

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /**
     * Vienos plytelės „paguldymo" progresas 0..1.
     * Bangos frontas juda įstrižai (kairė viršus -> dešinė apačia).
     */
    const tileProgress = (col: number, row: number, t: number, cols: number, rows: number) => {
      if (reduceMotion) return 1;
      const diagonal = (col + row) / Math.max(cols + rows - 2, 1);
      const stagger = diagonal * 0.55; // kiek vėluoja tolimesnės plytelės
      const local = (t - stagger) / 0.45;
      return Math.min(Math.max(local, 0), 1);
    };

    // easeOutCubic — plytelė „atgula" sklandžiai
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);

    const draw = (now: number) => {
      if (!running) return;

      const cycle = WAVE_MS + PAUSE_MS;
      const elapsed = (now - startTime) % cycle;
      const t = Math.min(elapsed / WAVE_MS, 1);

      ctx.clearRect(0, 0, width, height);

      const step = TILE + GROUT;
      const cols = Math.ceil(width / step) + 1;
      const rows = Math.ceil(height / step) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Kas antra eilė paslinkta — įprastas „running bond" klojimo raštas
          const offset = row % 2 === 0 ? 0 : step / 2;
          const x = col * step + offset - step / 2;
          const y = row * step;

          const p = tileProgress(col, row, t, cols, rows);
          if (p <= 0) continue;

          const e = ease(p);
          const inset = (1 - e) * 10; // plytelė „nusileidžia" į vietą
          const alpha = 0.05 + e * 0.05;

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + e * 0.07})`;
          ctx.lineWidth = 1;

          const tx = x + inset;
          const ty = y + inset;
          const size = TILE - inset * 2;
          if (size <= 0) continue;

          ctx.beginPath();
          ctx.roundRect(tx, ty, size, size, 3);
          ctx.fill();
          ctx.stroke();

          // Ką tik paguldytos plytelės kraštas trumpam blyksteli teal spalva
          const freshness = 1 - Math.min(Math.abs(p - 0.85) / 0.25, 1);
          if (freshness > 0 && !reduceMotion) {
            ctx.strokeStyle = `rgba(45, 212, 191, ${freshness * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      // Lazerinio nivelyro linija — juda kartu su bangos frontu
      if (!reduceMotion && t < 1) {
        const laserY = t * (height + 160) - 80;
        const gradient = ctx.createLinearGradient(0, laserY - 26, 0, laserY + 26);
        gradient.addColorStop(0, 'rgba(45, 212, 191, 0)');
        gradient.addColorStop(0.5, 'rgba(45, 212, 191, 0.16)');
        gradient.addColorStop(1, 'rgba(45, 212, 191, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, laserY - 26, width, 52);

        ctx.strokeStyle = 'rgba(94, 234, 212, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, laserY);
        ctx.lineTo(width, laserY);
        ctx.stroke();
      }

      if (reduceMotion) return; // statiškas kadras — ciklo nekartojam
      frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(performance.now());
    });
    resizeObserver.observe(canvas);

    // Stabdom animaciją, kai hero išslenka iš ekrano
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!running && !reduceMotion) {
            running = true;
            startTime = performance.now();
            frame = requestAnimationFrame(draw);
          }
        } else {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
