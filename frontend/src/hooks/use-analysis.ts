/**
 * useAnalysis Hook
 * Phase 3: React hook for running analysis with real-time progress tracking
 */

import { useState, useCallback, useEffect } from "react";
import type { AnalysisRequest, AnalysisOutput } from "../types/analysis";
import type { FirestoreProgress } from "../types/progress";

interface UseAnalysisOptions {
  onProgressUpdate?: (progress: FirestoreProgress) => void;
  onComplete?: (result: AnalysisOutput) => void;
  onError?: (error: Error) => void;
  autoSubscribe?: boolean;
}

interface UseAnalysisReturn {
  analysis: AnalysisOutput | null;
  progress: FirestoreProgress | null;
  loading: boolean;
  error: Error | null;
  startAnalysis: (request: AnalysisRequest) => Promise<void>;
  cancelAnalysis: () => void;
  subscribeToProgress: (sessionId: string) => () => void;
}

export const useAnalysis = (options: UseAnalysisOptions = {}): UseAnalysisReturn => {
  const {
    onProgressUpdate,
    onComplete,
    onError,
    autoSubscribe = true,
  } = options;

  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [progress, setProgress] = useState<FirestoreProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Subscribe to real-time progress updates
  const subscribeToProgress = useCallback(
    (sessionId: string): (() => void) => {
      // This would connect to a real-time listener in your backend
      // For now, returning a no-op function
      console.log(`Subscribing to progress for session: ${sessionId}`);
      return () => {};
    },
    []
  );

  // Start analysis
  const startAnalysis = useCallback(
    async (request: AnalysisRequest) => {
      try {
        setLoading(true);
        setError(null);
        setAnalysis(null);
        setProgress(null);

        const sessionId = request.sessionId || `session-${Date.now()}`;
        setCurrentSessionId(sessionId);

        // Subscribe to progress if auto-subscribe is enabled
        if (autoSubscribe) {
          const unsub = subscribeToProgress(sessionId);
          setUnsubscribe(() => unsub);
        }

        // Make API request to start analysis
        const response = await fetch("/api/v1/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...request,
            sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        const result: AnalysisOutput = await response.json();

        setAnalysis(result);
        setLoading(false);

        if (onComplete) {
          onComplete(result);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);

        if (onError) {
          onError(error);
        }
      }
    },
    [autoSubscribe, subscribeToProgress, onComplete, onError]
  );

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    if (unsubscribe) {
      unsubscribe();
    }
    setLoading(false);
    setCurrentSessionId(null);
  }, [unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  return {
    analysis,
    progress,
    loading,
    error,
    startAnalysis,
    cancelAnalysis,
    subscribeToProgress,
  };
};

/**
 * useAnalysisProgress Hook
 * Subscribe to real-time progress updates
 */
export const useAnalysisProgress = (sessionId: string | null) => {
  const [progress, setProgress] = useState<FirestoreProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // This would normally connect to a Firestore listener
    // For now, we'll implement a polling mechanism
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/v1/progress/${sessionId}`);
        if (response.ok) {
          const data: FirestoreProgress = await response.json();
          setProgress(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    // Poll every 500ms
    const interval = setInterval(pollProgress, 500);

    // Initial fetch
    pollProgress();

    return () => clearInterval(interval);
  }, [sessionId]);

  return { progress, error };
};
