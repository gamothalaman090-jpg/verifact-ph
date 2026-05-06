// ─────────────────────────────────────────────
// Backend API contract types
// Matches FastAPI response from /analyze
// ─────────────────────────────────────────────

export interface SourceInfo {
  type: 'url';
  source_url: string;
  title: string;
  extracted_length: number;
  partial?: boolean;
  from_slug?: boolean;
}

export interface FactCheckClaim {
  text: string;
  claimant: string;
  rating: string;
  rating_score: number;
  publisher: string;
  url: string;
  title: string;
}

export interface CorroborationSource {
  name: string;
  url: string;
  title: string;
  snippet: string;
  trust: number;
  type: string;
}

export interface EvidenceBreakdown {
  factcheck: {
    score: number;
    raw_score: number;
    has_results: boolean;
    claims: FactCheckClaim[];
    weight: string;
  };
  corroboration: {
    score: number;
    credible_count: number;
    total_count: number;
    top_sources: CorroborationSource[];
    weight: string;
  };
  ai_detection: {
    score: number;
    label: string;
    raw_prediction: string;
    raw_confidence: number;
    weight: string;
  };
}

export interface AnalysisResponse {
  verdict: string;
  verdict_score: number;
  verdict_color: string;
  evidence: EvidenceBreakdown;
  source?: SourceInfo;
}

export interface AnalysisError {
  error: string;
}

export type AnalysisResult = AnalysisResponse | AnalysisError;

export function isAnalysisError(result: AnalysisResult): result is AnalysisError {
  return 'error' in result;
}
