// ─────────────────────────────────────────────
// InkCanvas — Sticky scroll-driven canvas
// 400vh scroll runway with pinned viewport
// Procedural "newspaper scan" animation
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useScrollCanvas } from '../hooks/useScrollCanvas';

export default function InkCanvas() {
  const { containerRef, canvasRef, stickyRef } = useScrollCanvas({
    scrollMultiplier: 4,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Brief delay to ensure canvas is ready before showing
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      id="ink-canvas"
      style={{ height: '400vh' }}
      className="relative"
    >
      {/* Sticky viewport container */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden"
      >
        {/* Loading state */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-verdict-yellow border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-xs text-newsprint-dim tracking-[0.2em] uppercase">
                Initializing Scanner
              </span>
            </div>
          </div>
        )}

        {/* Canvas — responsively scaled */}
        <canvas
          ref={canvasRef}
          className={`transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            maxWidth: 'min(90vw, 800px)',
            maxHeight: 'min(85vh, 1000px)',
            width: '100%',
            height: '100%',
          }}
        />

        {/* Side annotations — desktop only */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-6">
          {['INGEST', 'SCAN', 'DETECT', 'VERDICT'].map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-6 h-px bg-newsprint-dim" />
              <span className="font-mono text-[9px] tracking-[0.2em] text-newsprint-dim">
                {String(i + 1).padStart(2, '0')} — {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
