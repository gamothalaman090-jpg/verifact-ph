// ─────────────────────────────────────────────
// AnalyzerSection — Fact-check verification tool
// ─────────────────────────────────────────────

import { useState, useRef } from 'react';
import {
  Search, AlertTriangle, CheckCircle, Loader2,
  ExternalLink, Globe, Shield, ShieldAlert, ShieldX,
  ShieldCheck, Newspaper, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { AnalysisResult, AnalysisResponse } from '../types/api';
import { isAnalysisError } from '../types/api';

// ── Verdict color map ──
const VERDICT_COLORS: Record<string, string> = {
  green: '#2ecc71',
  lime: '#a3e635',
  yellow: '#f0e130',
  orange: '#f39c12',
  red: '#c0392b',
};

const VERDICT_ICONS: Record<string, typeof ShieldCheck> = {
  VERIFIED: ShieldCheck,
  'LIKELY TRUE': Shield,
  UNVERIFIED: ShieldAlert,
  'LIKELY FALSE': ShieldAlert,
  FALSE: ShieldX,
};

export default function AnalyzerSection() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    setShowSources(false);

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: 'Failed to connect to the verification engine.' });
    } finally {
      setLoading(false);
    }
  };

  const prediction = result && !isAnalysisError(result) ? result as AnalysisResponse : null;
  const error = result && isAnalysisError(result) ? result : null;

  const verdictColor = prediction ? VERDICT_COLORS[prediction.verdict_color] || '#888' : '#888';
  const VerdictIcon = prediction ? VERDICT_ICONS[prediction.verdict] || ShieldAlert : ShieldAlert;

  return (
    <section
      ref={sectionRef}
      id="analyzer"
      style={{
        display: 'block',
        width: '100%',
        paddingTop: '140px',
        paddingBottom: '140px',
        paddingLeft: 'clamp(24px, 6vw, 120px)',
        paddingRight: 'clamp(24px, 6vw, 120px)',
      }}
    >
      <div style={{ maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Section label */}
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.3em',
          color: 'var(--color-verdict-yellow)',
          textTransform: 'uppercase',
          marginBottom: '20px',
        }}>
          03 — Verification Engine
        </span>

        {/* Heading */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
          fontWeight: 800,
          color: 'var(--color-newsprint)',
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          marginBottom: '52px',
        }}>
          SUBMIT FOR{' '}
          <span style={{ color: 'var(--color-verdict-yellow)' }}>VERIFICATION</span>
        </h2>

        {/* Divider */}
        <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '48px' }} />

        {/* Form */}
        <form onSubmit={handleAnalyze}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <textarea
              id="analyzer-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a claim, article text, or URL to verify..."
              required
              rows={7}
              style={{
                display: 'block',
                width: '100%',
                background: '#0a0a0a',
                border: '1px solid #222',
                color: 'var(--color-newsprint)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                padding: '20px 52px 20px 20px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.7,
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(240,225,48,0.4)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#222'; }}
            />
            <Search
              style={{ position: 'absolute', top: '20px', right: '18px', width: '16px', height: '16px', color: '#3a3a3a' }}
              strokeWidth={1.5}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            id="analyzer-submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--color-verdict-yellow)',
              color: 'var(--color-ink-black)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 32px',
              border: 'none',
              cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !text.trim() ? 0.45 : 1,
              transition: 'opacity 0.2s, filter 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading && text.trim()) (e.target as HTMLElement).style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.filter = 'none'; }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
                VERIFYING…
              </>
            ) : (
              'RUN FACT CHECK'
            )}
          </button>
        </form>

        {/* ─── RESULTS ─── */}
        {prediction && (
          <div style={{
            marginTop: '56px',
            border: '1px solid #1a1a1a',
            background: '#0a0a0a',
            overflow: 'hidden',
          }}>

            {/* Verdict Banner */}
            <div style={{
              padding: '40px',
              borderBottom: '1px solid #1a1a1a',
              background: `linear-gradient(135deg, rgba(${verdictColor === '#2ecc71' ? '46,204,113' : verdictColor === '#c0392b' ? '192,57,43' : verdictColor === '#f0e130' ? '240,225,48' : verdictColor === '#a3e635' ? '163,230,53' : '243,156,18'},0.06) 0%, transparent 60%)`,
            }}>
              {/* Source info */}
              {prediction.source && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #1a1a1a',
                }}>
                  <Globe style={{ width: '14px', height: '14px', color: verdictColor, flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--color-newsprint-dim)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {prediction.source.title || prediction.source.source_url}
                  </span>
                  <a
                    href={prediction.source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: verdictColor,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    <ExternalLink style={{ width: '10px', height: '10px' }} />
                    Source
                  </a>
                </div>
              )}

              {/* Verdict */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <VerdictIcon style={{ width: '40px', height: '40px', color: verdictColor, flexShrink: 0 }} strokeWidth={1.5} />
                <div>
                  <span style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    color: 'var(--color-newsprint-dim)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}>Verdict</span>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: verdictColor,
                    lineHeight: 1,
                  }}>
                    {prediction.verdict}
                  </p>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-newsprint-dim)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Confidence
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: verdictColor }}>
                    {(prediction.verdict_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '3px', background: '#1a1a1a', borderRadius: '2px' }}>
                  <div style={{
                    height: '100%',
                    background: verdictColor,
                    width: `${(prediction.verdict_score * 100).toFixed(1)}%`,
                    transition: 'width 1.2s ease-out',
                    borderRadius: '2px',
                  }} />
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div style={{ padding: '32px 40px' }}>
              <span style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: 'var(--color-newsprint-dim)',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}>Evidence Breakdown</span>

              {/* Fact-checker results */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <ShieldCheck style={{ width: '14px', height: '14px', color: '#888' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-newsprint)', fontWeight: 600 }}>
                    Fact-Checker Verdicts
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#555', marginLeft: 'auto' }}>
                    Weight: {prediction.evidence.factcheck.weight}
                  </span>
                </div>
                {prediction.evidence.factcheck.has_results ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {prediction.evidence.factcheck.claims.map((fc, i) => (
                      <div key={i} style={{ borderLeft: `2px solid ${verdictColor}30`, paddingLeft: '14px' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-newsprint)', lineHeight: 1.5 }}>
                          "{fc.text}"
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            padding: '2px 8px',
                            background: `${fc.rating_score > 0.3 ? '#2ecc7120' : fc.rating_score < -0.3 ? '#c0392b20' : '#f0e13020'}`,
                            color: fc.rating_score > 0.3 ? '#2ecc71' : fc.rating_score < -0.3 ? '#c0392b' : '#f0e130',
                            border: `1px solid ${fc.rating_score > 0.3 ? '#2ecc7130' : fc.rating_score < -0.3 ? '#c0392b30' : '#f0e13030'}`,
                          }}>
                            {fc.rating || 'Unrated'}
                          </span>
                          {fc.publisher && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555' }}>
                              — {fc.publisher}
                            </span>
                          )}
                          {fc.url && (
                            <a href={fc.url} target="_blank" rel="noopener noreferrer" style={{
                              fontFamily: 'var(--font-mono)', fontSize: '9px', color: verdictColor, textDecoration: 'none',
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                            }}>
                              <ExternalLink style={{ width: '9px', height: '9px' }} /> View
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                    No existing fact-checks found for this claim.
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '28px' }} />

              {/* News Corroboration */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Newspaper style={{ width: '14px', height: '14px', color: '#888' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-newsprint)', fontWeight: 600 }}>
                    News Corroboration
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#555', marginLeft: 'auto' }}>
                    Weight: {prediction.evidence.corroboration.weight}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-newsprint-dim)', marginBottom: '12px' }}>
                  Found {prediction.evidence.corroboration.credible_count} credible source{prediction.evidence.corroboration.credible_count !== 1 ? 's' : ''} out of {prediction.evidence.corroboration.total_count} results
                </p>

                {prediction.evidence.corroboration.top_sources.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowSources(!showSources)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: verdictColor,
                        background: 'none',
                        border: `1px solid ${verdictColor}30`,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {showSources ? <ChevronUp style={{ width: '12px', height: '12px' }} /> : <ChevronDown style={{ width: '12px', height: '12px' }} />}
                      {showSources ? 'Hide' : 'View'} Sources
                    </button>

                    {showSources && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                        {prediction.evidence.corroboration.top_sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'block',
                              borderLeft: '2px solid #1a1a1a',
                              paddingLeft: '14px',
                              textDecoration: 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '10px',
                                padding: '1px 6px',
                                background: src.trust >= 0.85 ? '#2ecc7115' : '#f0e13015',
                                color: src.trust >= 0.85 ? '#2ecc71' : '#f0e130',
                                border: `1px solid ${src.trust >= 0.85 ? '#2ecc7125' : '#f0e13025'}`,
                              }}>
                                {src.name}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#444' }}>
                                Trust: {(src.trust * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-newsprint-dim)', lineHeight: 1.4 }}>
                              {src.title}
                            </p>
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>



            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '48px',
            border: '1px solid rgba(192,57,43,0.3)',
            background: 'rgba(192,57,43,0.05)',
            padding: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}>
            <AlertTriangle style={{ width: '18px', height: '18px', color: 'var(--color-blood-red)', flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-blood-red)' }}>{error.error}</p>
              <button
                onClick={() => setResult(null)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-newsprint-dim)', textDecoration: 'underline', marginTop: '8px', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </section>
  );
}
