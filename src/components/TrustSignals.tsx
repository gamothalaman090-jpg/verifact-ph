// ─────────────────────────────────────────────
// TrustSignals — "How It Works" strip
// ─────────────────────────────────────────────

import { FileText, Cpu, ShieldCheck } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'INGEST',
    description: 'Paste any article, URL, or claim. Our engine accepts raw text of any length.',
    Icon: FileText,
  },
  {
    num: '02',
    title: 'ANALYZE',
    description: 'A fine-tuned RoBERTa transformer cross-references linguistic patterns against verified datasets.',
    Icon: Cpu,
  },
  {
    num: '03',
    title: 'VERDICT',
    description: 'Receive a confidence-scored prediction, verified against Google Fact Check Tools API.',
    Icon: ShieldCheck,
  },
] as const;

export default function TrustSignals() {
  return (
    <section
      id="trust-signals"
      style={{
        display: 'block',
        width: '100%',
        paddingTop: '140px',
        paddingBottom: '140px',
        paddingLeft: 'clamp(24px, 6vw, 120px)',
        paddingRight: 'clamp(24px, 6vw, 120px)',
      }}
    >
      {/* Centered inner container */}
      <div style={{ maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Top rule */}
        <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '28px' }} />

        {/* Label */}
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.3em',
          color: 'var(--color-verdict-yellow)',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          02 — Methodology
        </span>

        {/* Heading */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4.5vw, 4rem)',
          fontWeight: 800,
          color: 'var(--color-newsprint)',
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          marginBottom: '72px',
        }}>
          HOW THE ENGINE{' '}
          <span style={{ color: 'var(--color-newsprint-dim)' }}>WORKS</span>
        </h2>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}>
          {steps.map(({ num, title, description, Icon }) => (
            <div
              key={num}
              style={{
                border: '1px solid #1a1a1a',
                background: '#0a0a0a',
                padding: '40px',
                transition: 'border-color 0.4s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,225,48,0.2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a'; }}
            >
              <span style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.3em',
                color: 'var(--color-newsprint-dim)',
                marginBottom: '24px',
              }}>
                {num}
              </span>

              <Icon
                style={{ width: '28px', height: '28px', color: 'var(--color-verdict-yellow)', marginBottom: '24px' }}
                strokeWidth={1.2}
              />

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-newsprint)',
                letterSpacing: '-0.02em',
                marginBottom: '14px',
              }}>
                {title}
              </h3>

              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-newsprint-dim)',
                lineHeight: 1.7,
              }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
