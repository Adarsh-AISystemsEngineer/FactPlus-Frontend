import { useMutation } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/auth-context";
import { claimService, analysisService } from "@/lib/firestore-service";
import { useRef } from "react";
import { toast } from "sonner";

interface FactCheckInput {
  claim: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  fileCount?: number;
  previousClaims?: string[]; // Previous claims for context
}

interface FactCheckResult {
  claimId: string;
  sessionId: string;
  score: number;
  summary: string;
  reasoning: any;
  sources: any[];
  credibilityScore?: any;
  analysisSummary?: any;
  reasoningTrace?: any;
  evidenceSources?: any;
  analysisMetadata?: any;
  [key: string]: any;
}

export function useFactCheck() {
  const { user, getToken } = useAuthContext();
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: FactCheckInput | string) => {
      if (!user?.uid) throw new Error("Not authenticated");
      
      const token = getToken?.();
      if (!token) throw new Error("No auth token");

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Handle both string (legacy) and object input
      const factCheckInput: FactCheckInput = typeof input === "string" 
        ? { claim: input }
        : input;

      // Create claim document first
      const claimId = await claimService.createClaim(user.uid, factCheckInput.claim);

      try {
        // Prepare request body
        const requestBody: any = {
          claim: factCheckInput.claim,
          userId: user.uid,
          claimId,
        };

        // Add attachments if present
        if (factCheckInput.attachments && factCheckInput.attachments.length > 0) {
          requestBody.attachments = factCheckInput.attachments;
        }

        // Add previous claims as context for the LLM
        if (factCheckInput.previousClaims && factCheckInput.previousClaims.length > 0) {
          requestBody.previousClaims = factCheckInput.previousClaims;
        }

        // Call fact-check API with abort signal
        const response = await fetch("/api/fact-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";
          let errorMessage = "Fact-check failed";
          
          try {
            if (contentType.includes("application/json")) {
              const error = await response.json();
              errorMessage = error.error || error.message || errorMessage;
            } else {
              const text = await response.text();
              console.error("[useFactCheck] Non-JSON response:", {
                status: response.status,
                contentType,
                preview: text.substring(0, 300),
              });
              errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
            }
          } catch (parseError) {
            console.error("[useFactCheck] Error parsing error response:", parseError);
          }
          
          throw new Error(errorMessage);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await response.text();
          console.error("[useFactCheck] Expected JSON but got:", {
            contentType,
            preview: text.substring(0, 300),
          });
          throw new Error(`Expected JSON response, got ${contentType}`);
        }

        const result = await response.json();

        // Save analysis result - only include defined fields
        const analysisData: any = {};
        
        const score = result.data?.credibilityScore?.value || result.data?.score;
        if (score !== undefined) analysisData.score = score;
        
        const summary = result.data?.analysisSummary?.message || result.data?.summary;
        if (summary !== undefined) analysisData.summary = summary;
        
        const reasoning = result.data?.reasoningTrace || result.data?.reasoning;
        if (reasoning !== undefined) analysisData.reasoning = reasoning;
        
        const sources = result.data?.evidenceSources?.sources || result.data?.sources;
        if (sources !== undefined) analysisData.sources = sources;
        
        analysisData.sessionId = result.sessionId;

        // Update claim with analysisResult field (for knowledge graph)
        await claimService.updateClaim(claimId, {
          analysisResult: analysisData
        });

        // Also create separate analysis document for backward compatibility
        await analysisService.createAnalysis(claimId, user.uid, analysisData);

        return { 
          claimId, 
          sessionId: result.sessionId,
          ...result.data 
        } as FactCheckResult;
      } catch (error) {
        // Delete claim if analysis failed
        await claimService.deleteClaim(claimId);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Fact-check error:", error);
    },
  });

  return {
    ...mutation,
    cancel: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      mutation.reset();
    },
  };
}
