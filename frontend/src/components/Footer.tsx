// ─────────────────────────────────────────────
// Footer — Enhanced brutalist footer
// ─────────────────────────────────────────────

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      style={{
        display: 'block',
        width: '100%',
        paddingLeft: 'clamp(24px, 6vw, 120px)',
        paddingRight: 'clamp(24px, 6vw, 120px)',
        paddingBottom: '60px',
      }}
    >
      <div style={{ maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Top divider */}
        <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '72px' }} />

        {/* Main footer grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px 64px',
          marginBottom: '72px',
        }}>

          {/* Brand column */}
          <div>
            <span style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: 'var(--color-newsprint)',
              marginBottom: '12px',
            }}>
              VERIFACT
            </span>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-newsprint-dim)',
              lineHeight: 1.9,
              maxWidth: '260px',
            }}>
              An AI-powered truth engine. Powered by Google Gemini AI, Google Fact Check, news search, and Wikipedia references.
            </p>
          </div>

          {/* Navigate column */}
          <div>
            <span style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: 'var(--color-verdict-yellow)',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}>
              Navigate
            </span>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'The Mission', href: '#editorial-hero' },
                { label: 'How It Works', href: '#trust-signals' },
                { label: 'Verify Now', href: '#analyzer' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'rgba(232,230,225,0.5)',
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--color-newsprint)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(232,230,225,0.5)'; }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Tech column */}
          <div>
            <span style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: 'var(--color-verdict-yellow)',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}>
              Technology
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Google Gemini AI', 'Google Fact Check API', 'FastAPI Backend', 'React + Vite Frontend'].map((tech) => (
                <span key={tech} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'rgba(232,230,225,0.5)',
                  letterSpacing: '0.05em',
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* CTA column */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                fontStyle: 'italic',
                color: 'rgba(232,230,225,0.7)',
                lineHeight: 1.5,
                marginBottom: '24px',
              }}>
                "Accuracy is a process, not a destination."
              </p>
              <a
                href="#analyzer"
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#050505',
                  background: 'var(--color-verdict-yellow)',
                  padding: '12px 28px',
                  textDecoration: 'none',
                  transition: 'filter 0.2s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.filter = 'none'; }}
              >
                Start Verifying →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div style={{ height: '1px', background: '#111', marginBottom: '28px' }} />

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'rgba(232,230,225,0.25)',
            letterSpacing: '0.08em',
          }}>
            © {year} VERIFACT. TRUTH ENGINE. ALL RIGHTS RESERVED.
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'rgba(232,230,225,0.2)',
            letterSpacing: '0.08em',
          }}>
            BUILT FOR THE PURSUIT OF FACT.
          </span>
        </div>
      </div>
    </footer>
  );
}
