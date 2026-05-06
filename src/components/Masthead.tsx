// ─────────────────────────────────────────────
// Masthead — Floating pill navbar
// Reference: centered dark capsule with brand | links | CTA
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';

export default function Masthead() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'THE MISSION', href: '#editorial-hero' },
    { label: 'HOW IT WORKS', href: '#trust-signals' },
    { label: 'VERIFY', href: '#analyzer' },
  ];

  return (
    <header
      id="masthead"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        padding: scrolled ? '12px 24px' : '20px 24px',
        transition: 'padding 0.4s ease',
        pointerEvents: 'none',
      }}
    >
      {/* Pill container */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0',
          width: '100%',
          maxWidth: '860px',
          background: scrolled
            ? 'rgba(8, 8, 8, 0.96)'
            : 'rgba(12, 12, 12, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '999px',
          padding: '10px 10px 10px 24px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          transition: 'background 0.4s ease, box-shadow 0.4s ease',
          pointerEvents: 'auto',
        }}
      >
        {/* Brand */}
        <a
          href="#"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: 'var(--color-newsprint)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          VERIFACT
        </a>

        {/* Center nav links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.18em',
                color: 'rgba(232, 230, 225, 0.55)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'var(--color-newsprint)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'rgba(232, 230, 225, 0.55)';
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA pill button */}
        <a
          href="#analyzer"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: '#050505',
            background: 'var(--color-newsprint)',
            borderRadius: '999px',
            padding: '10px 22px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = 'var(--color-verdict-yellow)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'var(--color-newsprint)';
          }}
        >
          VERIFY NOW
        </a>
      </nav>
    </header>
  );
}
