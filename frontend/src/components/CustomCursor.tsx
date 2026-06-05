// ─────────────────────────────────────────────
// CustomCursor — Real-time circle cursor
// • Instant mouse tracking (no lag)
// • Hides on textarea/input
// • Shows link label on anchor hover
// ─────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    document.documentElement.style.cursor = 'none';

    // Direct DOM manipulation for zero-lag tracking
    const onMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const onEnterInput = () => setHidden(true);
    const onLeaveInput = () => setHidden(false);

    const onEnterLink = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      // Use aria-label, title, text content, or href
      const text =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.textContent?.trim().slice(0, 28) ||
        el.getAttribute('href') ||
        '';
      setLabel(text);
    };
    const onLeaveLink = () => setLabel('');

    window.addEventListener('mousemove', onMove);

    // Inputs — hide cursor
    const inputs = document.querySelectorAll<HTMLElement>('textarea, input');
    inputs.forEach((el) => {
      el.addEventListener('mouseenter', onEnterInput);
      el.addEventListener('mouseleave', onLeaveInput);
      el.style.cursor = 'text';
    });

    // Links & buttons — show label
    const links = document.querySelectorAll<HTMLElement>('a, button');
    links.forEach((el) => {
      el.addEventListener('mouseenter', onEnterLink);
      el.addEventListener('mouseleave', onLeaveLink);
      el.style.cursor = 'none';
    });

    return () => {
      document.documentElement.style.cursor = '';
      window.removeEventListener('mousemove', onMove);

      inputs.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterInput);
        el.removeEventListener('mouseleave', onLeaveInput);
        el.style.cursor = '';
      });
      links.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterLink);
        el.removeEventListener('mouseleave', onLeaveLink);
        el.style.cursor = '';
      });
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        willChange: 'transform',
        // Center the ring on the pointer
        marginLeft: '-18px',
        marginTop: '-18px',
        opacity: hidden ? 0 : 1,
        transition: 'opacity 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Circle + dot */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1.5px solid rgba(232, 230, 225, 0.9)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Scale up slightly when a label is showing
          transform: label ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}
      >
        <div
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'rgba(232, 230, 225, 0.9)',
          }}
        />
      </div>

      {/* Link label */}
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-verdict-yellow)',
            background: 'rgba(5, 5, 5, 0.85)',
            padding: '4px 8px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(240, 225, 48, 0.2)',
            lineHeight: 1,
            pointerEvents: 'none',
            // Animate in
            animation: 'labelIn 0.15s ease forwards',
          }}
        >
          {label}
        </span>
      )}

      <style>{`
        @keyframes labelIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        * { cursor: none !important; }
        textarea, input { cursor: text !important; }
      `}</style>
    </div>
  );
}
