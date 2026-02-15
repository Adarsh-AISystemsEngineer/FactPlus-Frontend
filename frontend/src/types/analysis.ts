/**
 * Client-side type definitions for analysis
 * Mirrors server types for client use
 */

export interface Claim {
  id: string;
  text: string;
  type: "statistical" | "event" | "attribution" | "prediction" | "opinion";
  entities: Entity[];
  verifiable: "high" | "medium" | "low";
  context: string;
  confidence: number;
}

export interface Entity {
  id: string;
  name: string;
  type: "person" | "organization" | "location" | "date" | "topic";
}

export interface SourcePassage {
  text: string;
  pageNumber?: number;
  timestamp?: string;
  relevance: number;
  highlighted: boolean;
  context?: string;
}

export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  type: "news" | "academic" | "government" | "fact-check" | "social-media" | "blog" | "database";
  reliabilityScore: number;
  reliabilityTier: "tier1" | "tier2" | "tier3" | "tier4";
  author?: string;
  publishDate?: Date;
  lastUpdated?: Date;
  stance: "supporting" | "refuting" | "neutral" | "mixed";
  relevanceScore: number;
  extractedPassages: SourcePassage[];
  citationFormat: {
    apa: string;
    mla: string;
    chicago: string;
  };
  fetchedAt: Date;
  verificationStatus: "verified" | "pending" | "disputed";
  userNotes?: string;
  bookmarked?: boolean;
}

export interface ReasoningFinding {
  id: string;
  title: string;
  explanation: string;
  confidence: number;
  supportingSources: Array<{
    sourceId: string;
    relevance: string;
    quote?: string;
  }>;
  conflictingSources?: Array<{
    sourceId: string;
    conflict: string;
  }>;
}

export interface ReasoningTrace {
  findings: ReasoningFinding[];
  analysisConfidence: number;
  confidenceNote: string;
  limitationsAndCaveats: string[];
}

export interface GraphNode {
  id: string;
  type: "claim" | "source" | "finding" | "entity";
  label: string;
  value?: number;
  confidence?: number;
  color?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "supports" | "refutes" | "related" | "cites" | "reasoning";
  strength: number;
  weight?: number;
  label?: string;
}

export interface NeuralGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: {
    id: string;
    name: string;
    nodes: string[];
    color: string;
  }[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    clusteringCoefficient: number;
  };
}

export interface UserInput {
  content: string | Buffer;
  type: "text" | "pdf" | "image" | "audio" | "json" | "csv";
  metadata?: {
    fileName?: string;
    mimeType?: string;
    size?: number;
    language?: string;
    source?: string;
  };
}

export interface AnalysisOutput {
  claimText: string;
  credibilityScore: {
    value: number;
    label: "HIGH ACCURACY" | "LIKELY ACCURATE" | "MODERATELY ACCURATE" | "MIXED ACCURACY" | "DISPUTED" | "LIKELY FALSE";
    color: string;
  };
  neuralGraph: NeuralGraph;
  verificationStatus: {
    sourceReliability: number;
    crossReference: number;
    contentMatch: number;
  };
  analysisSummary: {
    status: "complete" | "failed" | "partial";
    message: string;
    timestamp: Date;
  };
  reasoningTrace: ReasoningTrace;
  supportingEvidence: EvidenceSource[];
  evidenceSources: {
    summary: {
      totalSourcesChecked: number;
      reliableSourcesFound: number;
      unreliableSourcesFound: number;
      sourcesSupporting: number;
      sourcesRefuting: number;
      sourcesNeutral: number;
    };
    sources: EvidenceSource[];
    searchMetadata: any;
  };
  analysisMetadata: {
    analyzedAt: Date;
    processingTime: number;
    sourcesChecked: number;
    agentsUsed: string[];
    inputType: string;
  };
}

export interface AnalysisRequest {
  input: UserInput;
  userId: string;
  sessionId: string;
  options?: {
    maxSources?: number;
    timeoutSeconds?: number;
    includeGraph?: boolean;
    includeReport?: boolean;
  };
}
