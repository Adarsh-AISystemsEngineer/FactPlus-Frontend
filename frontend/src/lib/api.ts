/**
 * API Service for FactPlus
 * Handles all communication with the backend
 */

import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface AnalysisRequest {
  claim: string;
  context?: string;
  forceRefresh?: boolean;
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    id: string;
    claim: string;
    credibilityScore: number;
    verdict: "TRUE" | "MOSTLY_TRUE" | "MIXED" | "MOSTLY_FALSE" | "FALSE" | "UNVERIFIABLE";
    summary: string;
    evidence: Array<{
      source_name: string;
      source_url: string;
      quote: string;
      relevance: string;
      date_published?: string;
    }>;
    relatedTopics: string[];
    nodes: Array<{
      nodeId: string;
      label: string;
      credibilityScore: number;
      verdict?: string;
      color?: string;
      size?: number;
    }>;
    relatedContent: Array<{
      title: string;
      relevance: number;
      keyword: string;
    }>;
    canDownloadReport: boolean;
    cached?: boolean;
  };
  error?: string;
  timestamp?: string;
}

export interface FeedbackRequest {
  analysisId: string;
  claimHash: string;
  systemVerdict: string;
  systemScore: number;
  userVerdict: string;
  userScore: number;
  userNote?: string;
}

export interface ReportRequest {
  analysisId?: string;
  analysis: any;
}

export interface ReportResponse {
  success: boolean;
  data?: {
    reportId: string;
    fileName: string;
    format: string;
    downloadUrl: string;
  };
  error?: string;
}

/**
 * Analyze a claim using the FactPlus engine
 */
export async function analyzeClaimAsync(request: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    toast.error(message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generate a PDF report for an analysis
 */
export async function generateReportAsync(request: ReportRequest): Promise<ReportResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/reports/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed";
    toast.error(message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Download a report PDF
 */
export async function downloadReportAsync(reportId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/reports/download/${reportId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report_${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to download report";
    toast.error(message);
  }
}

/**
 * Submit feedback on an analysis
 */
export async function submitFeedbackAsync(feedback: FeedbackRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    toast.success("Thank you for your feedback!");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit feedback";
    toast.error(message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get cache statistics (admin endpoint)
 */
export async function getCacheStatsAsync(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/cache/stats`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch cache stats:", error);
    return { success: false };
  }
}

/**
 * Get feedback statistics (admin endpoint)
 */
export async function getFeedbackStatsAsync(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/feedback/stats`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch feedback stats:", error);
    return { success: false };
  }
}

/**
 * Health check endpoint
 */
export async function healthCheckAsync(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
}
