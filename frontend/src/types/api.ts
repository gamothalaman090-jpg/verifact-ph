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

export interface WikipediaArticle {
  title: string;
  snippet: string;
  url: string;
  timestamp: string;
}

export interface EvidenceAnalysis {
  source: string;
  finding: string;
  impact: 'positive' | 'negative' | 'neutral' | 'unavailable';
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
    label: string;
    raw_prediction: string;
    raw_confidence: number;
    weight: string;
  };
  wikipedia: {
    has_results: boolean;
    articles: WikipediaArticle[];
    search_terms: string;
  };
}

export interface WebSearchSource {
  title: string;
  url: string;
}

export interface AnalysisResponse {
  verdict: string;
  verdict_score: number;
  verdict_color: string;
  evidence: EvidenceBreakdown;
  source?: SourceInfo;
  explanation?: string;
  evidence_analysis?: EvidenceAnalysis[];
  engine?: 'gemini' | 'fallback';
  web_sources?: WebSearchSource[];
}

export interface AnalysisError {
  error: string;
}

export type AnalysisResult = AnalysisResponse | AnalysisError;

export function isAnalysisError(result: AnalysisResult): result is AnalysisError {
  return 'error' in result;
}

