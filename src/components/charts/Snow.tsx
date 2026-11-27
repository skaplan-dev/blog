import { useEffect, useRef } from 'react';

type Props = {
  /** Cover the whole window behind the page, instead of filling the parent. */
  fixed?: boolean;
  /** Flakes per 100,000 square pixels. */
  density?: number;
  /** Sideways drift, in pixels a second. */
  wind?: number;
};

type Flake = { x: number; y: number; r: number; phase: number };

/** Falling snow on a canvas. With reduced motion it draws one still frame. */
export default function Snow({ fixed = false, density = 9, wind = 8 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];

    const spawn = (y: number): Flake => ({
      x: Math.random() * w,
      y,
      r: 0.5 + Math.random() ** 2.2 * 2.3,
      phase: Math.random() * Math.PI * 2,
    });
    const size = () => {
      const box = fixed ? { width: window.innerWidth, height: window.innerHeight } : canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, box.width);
      h = Math.max(1, box.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / 100000) * density);
      flakes = Array.from({ length: count }, () => spawn(Math.random() * h));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        // A faint cold rim lets white flakes read on pale ground.
        ctx.fillStyle = 'rgba(70, 84, 100, 0.12)';
        ctx.beginPath();
        ctx.arc(f.x, f.y + 0.4, f.r + 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    size();
    const ro = new ResizeObserver(size);
    if (!fixed) ro.observe(canvas);
    if (fixed) window.addEventListener('resize', size);
    if (still) {
      draw();
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', size);
      };
    }

    let raf = 0;
    let prev = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;
      for (const f of flakes) {
        // Big (near) flakes fall faster; every flake sways a little.
        f.y += (10 + f.r * 14) * dt;
        f.x += (wind + Math.sin(t / 1400 + f.phase) * 10) * dt;
        if (f.y > h + 4) Object.assign(f, spawn(-4));
        if (f.x > w + 4) f.x = -4;
        if (f.x < -4) f.x = w + 4;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', size);
    };
  }, [fixed, density, wind]);

  return <canvas ref={ref} className={fixed ? 'snow snow-fixed' : 'snow'} aria-hidden="true" />;
}
