/**
 * Transforms raw fact-check API responses into the UI-expected format
 */

export interface ReasoningTrace {
  findings?: string[];
  analysisConfidence?: number;
  confidenceNote?: string;
  limitationsAndCaveats?: string[];
  summary?: string;
  keyPoints?: string[];
  conclusion?: string;
  confidence?: number;
}

export interface RawFactCheckResponse {
  score?: number;
  credibilityScore?: { value: number; label: string; color: string };
  summary?: string;
  analysisSummary?: { message: string; status: string; timestamp: string };
  reasoning?: string[];
  reasoningTrace?: ReasoningTrace;
  sources?: any[];
  evidenceSources?: { sources: any[] };
  confidence?: number;
  verdict?: string;
  contradictions?: string[];
  evidence?: string[];
  [key: string]: any;
}

export interface TransformedAnalysis {
  score: number;
  summary: string;
  reasoning: {
    title: string;
    description: string;
    status: "verified" | "warning" | "refuted" | "neutral";
  }[];
  sources: {
    title: string;
    url: string;
    credibility: "high" | "medium" | "low";
  }[];
  verdict?: string;
  confidence?: number;
  contradictions?: string[];
  evidence?: string[];
  analysisConfidence?: number;
  confidenceNote?: string;
  limitations?: string[];
}

/**
 * Converts raw API response to UI format
 * Properly handles both simple and complex reasoning structures
 */
export function transformAnalysisResponse(rawResponse: RawFactCheckResponse): TransformedAnalysis {
  // Extract score (handle both formats)
  const score = rawResponse.score ?? rawResponse.credibilityScore?.value ?? 50;
  
  // Extract summary (handle both formats)
  const summary = rawResponse.summary ?? rawResponse.analysisSummary?.message ?? "Analysis completed";

  // Determine verdict status based on score
  let verdictStatus: "verified" | "warning" | "refuted" | "neutral" = "neutral";
  
  if (rawResponse.verdict === "FALSE" || score < 30) {
    verdictStatus = "refuted";
  } else if (rawResponse.verdict === "TRUE" || score > 70) {
    verdictStatus = "verified";
  } else if (score > 40 && score < 60) {
    verdictStatus = "warning";
  }

  // Transform reasoning - handle both simple array and complex reasoningTrace object
  const reasoning: Array<{ title: string; description: string; status: "verified" | "warning" | "refuted" | "neutral" }> = [];
  
  // Priority 1: Use reasoningTrace object if available (from Phase 2 orchestrator)
  const reasoningTrace = rawResponse.reasoningTrace;
  if (reasoningTrace && typeof reasoningTrace === "object") {
    // NOTE: Findings with proper structure (title, explanation, confidence, sources)
    // are kept as-is in reasoningTrace. DO NOT stringify them.
    // The AnalysisResultComponent handles finding objects directly.
    // This transformer now only builds reasoning for the old AnalysisView component fallback.
    
    if (reasoningTrace.findings && Array.isArray(reasoningTrace.findings) && reasoningTrace.findings.length > 0) {
      // Skip old transformation - findings are passed to UI components as structured objects
      // Do not create "reasoning" entries that stringify findings
    }

    // Add key points if no findings
    if (reasoning.length === 0 && reasoningTrace.keyPoints && Array.isArray(reasoningTrace.keyPoints)) {
      reasoningTrace.keyPoints.forEach((point: any) => {
        // Ensure point is a string
        const pointText = typeof point === "string"
          ? point
          : typeof point === "object"
          ? JSON.stringify(point)
          : String(point);
        
        reasoning.push({
          title: "Key Point",
          description: pointText,
          status: "verified" as const
        });
      });
    }

    // NOTE: Analysis confidence, limitations, and conclusion are now 
    // handled directly by AnalysisResultComponent from reasoningTrace.
    // Do NOT duplicate these in the transformed reasoning array to avoid redundancy.
  }
  
  // Priority 2: Fall back to simple reasoning array if available
  if (reasoning.length === 0 && rawResponse.reasoning && Array.isArray(rawResponse.reasoning)) {
    reasoning.push(...(rawResponse.reasoning || []).map((reason: any, index: number) => {
      const reasonText = typeof reason === "string"
        ? reason
        : typeof reason === "object"
        ? JSON.stringify(reason)
        : String(reason);
      
      return {
        title: `Finding ${index + 1}`,
        description: reasonText,
        status: verdictStatus as "verified" | "warning" | "refuted" | "neutral"
      };
    }));
  }

  // Add verdict as a special reasoning item if it's explicitly FALSE
  if (rawResponse.verdict === "FALSE" && rawResponse.contradictions && rawResponse.contradictions.length > 0) {
    const contradictionText = typeof rawResponse.contradictions[0] === "string"
      ? rawResponse.contradictions[0]
      : JSON.stringify(rawResponse.contradictions[0]);
    
    reasoning.unshift({
      title: "Critical: Statement Contradicts Facts",
      description: contradictionText,
      status: "refuted"
    });
  }

  // Transform sources into UI format
  const sources = (rawResponse.sources || rawResponse.evidenceSources?.sources || []).map((source: any, index: number) => {
    const credibilityMap = {
      high: "high" as const,
      medium: "medium" as const,
      low: "low" as const,
    };

    // Ensure title is a string
    const sourceTitle = typeof source === "string" 
      ? source 
      : (source?.title || `Source ${index + 1}`);
    
    // Ensure URL is a string
    const sourceUrl = typeof source === "object" && source?.url 
      ? String(source.url)
      : "#";

    return {
      title: String(sourceTitle),
      url: sourceUrl,
      credibility: (typeof source === "object" && source?.credibility) 
        ? credibilityMap[source.credibility as keyof typeof credibilityMap] || "medium"
        : "medium"
    };
  });

  // Add evidence items as sources if not already present
  if (rawResponse.evidence && rawResponse.evidence.length > 0 && sources.length === 0) {
    rawResponse.evidence.forEach((evidence: any, index: number) => {
      const evidenceText = typeof evidence === "string"
        ? evidence
        : JSON.stringify(evidence);
      
      sources.push({
        title: `Evidence Required: ${evidenceText}`,
        url: "#",
        credibility: "medium"
      });
    });
  }

  // Build result object with all available fields
  const result: TransformedAnalysis = {
    score: Math.max(0, Math.min(100, score)),
    summary: summary,
    reasoning,
    sources,
  };

  // Add optional fields if they're defined
  if (rawResponse.verdict !== undefined && rawResponse.verdict !== null) {
    result.verdict = rawResponse.verdict;
  }
  if (rawResponse.confidence !== undefined && rawResponse.confidence !== null) {
    result.confidence = rawResponse.confidence;
  }
  if (reasoningTrace?.analysisConfidence !== undefined && reasoningTrace.analysisConfidence !== null) {
    result.analysisConfidence = reasoningTrace.analysisConfidence;
  }
  if (reasoningTrace?.confidenceNote !== undefined && reasoningTrace.confidenceNote !== null) {
    const noteText = typeof reasoningTrace.confidenceNote === "string"
      ? reasoningTrace.confidenceNote
      : JSON.stringify(reasoningTrace.confidenceNote);
    result.confidenceNote = noteText;
  }
  if (reasoningTrace?.limitationsAndCaveats !== undefined && reasoningTrace.limitationsAndCaveats !== null && reasoningTrace.limitationsAndCaveats.length > 0) {
    result.limitations = reasoningTrace.limitationsAndCaveats.map((lim: any) =>
      typeof lim === "string" ? lim : JSON.stringify(lim)
    );
  }
  if (rawResponse.contradictions !== undefined && rawResponse.contradictions !== null && rawResponse.contradictions.length > 0) {
    result.contradictions = rawResponse.contradictions.map((c: any) =>
      typeof c === "string" ? c : JSON.stringify(c)
    );
  }
  if (rawResponse.evidence !== undefined && rawResponse.evidence !== null && rawResponse.evidence.length > 0) {
    result.evidence = rawResponse.evidence.map((e: any) =>
      typeof e === "string" ? e : JSON.stringify(e)
    );
  }

  return result;
}

/**
 * Determines a color for the score based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-yellow-500";
  if (score >= 20) return "text-orange-500";
  return "text-red-500";
}

/**
 * Gets a verdict label for display
 */
export function getVerdictLabel(score: number, verdict?: string): string {
  if (verdict === "FALSE" || score < 20) return "FALSE";
  if (verdict === "TRUE" || score > 80) return "TRUE";
  if (verdict === "UNVERIFIED") return "UNVERIFIED";
  if (score >= 50) return "MIXED/NEEDS VERIFICATION";
  return "LIKELY FALSE";
}
