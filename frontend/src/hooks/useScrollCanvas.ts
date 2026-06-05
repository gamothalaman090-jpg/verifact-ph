// ─────────────────────────────────────────────
// useScrollCanvas — GSAP ScrollTrigger + Canvas
// Binds scroll position to a 0→1 progress value
// and drives the canvas renderer at 60fps
// ─────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { renderFrame } from '../lib/canvas-renderer';

gsap.registerPlugin(ScrollTrigger);

interface UseScrollCanvasOptions {
  /** Height multiplier for the scroll runway (default: 4 = 400vh) */
  scrollMultiplier?: number;
}

interface UseScrollCanvasReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stickyRef: React.RefObject<HTMLDivElement | null>;
}

export function useScrollCanvas(
  options: UseScrollCanvasOptions = {},
): UseScrollCanvasReturn {
  const { scrollMultiplier = 4 } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  // Resize canvas to fill the sticky container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const sticky = stickyRef.current;
    if (!canvas || !sticky) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = sticky.getBoundingClientRect();

    // Logical size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Physical size (retina)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }, []);

  // Animation loop — only runs while pinned
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    renderFrame(ctx, progressRef.current, w, h, dpr);

    if (isActiveRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    resizeCanvas();

    // Start animation loop
    isActiveRef.current = true;
    rafRef.current = requestAnimationFrame(animate);

    // GSAP ScrollTrigger — scrubs progress 0→1
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    // Resize observer
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(container);

    // Window resize
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      isActiveRef.current = false;
      cancelAnimationFrame(rafRef.current);
      trigger.kill();
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [animate, resizeCanvas, scrollMultiplier]);

  return { containerRef, canvasRef, stickyRef };
}
