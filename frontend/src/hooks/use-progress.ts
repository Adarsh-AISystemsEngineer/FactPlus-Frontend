/**
 * Real-time Progress Hook
 * Listens to Firestore analysis_progress collection for real-time updates
 */

import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import type { AnalysisStage } from "../types/analysis";

export interface ProgressUpdate {
  id: string;
  userId: string;
  stage: AnalysisStage;
  progress: number; // 0-100
  status: "running" | "complete" | "failed";
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  failedAt?: number;
  estimatedTimeRemaining?: number;
  error?: string;
  partialResults?: Record<string, any>;
  currentAgent?: string;
}

interface UseProgressReturn {
  progress: ProgressUpdate | null;
  loading: boolean;
  error: Error | null;
  isComplete: boolean;
  isFailed: boolean;
}

/**
 * Hook for listening to real-time progress updates
 */
export const useProgress = (analysisId: string | null): UseProgressReturn => {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    if (!analysisId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsComplete(false);
    setIsFailed(false);

    // Subscribe to progress updates using modular API
    const docRef = doc(db, "analysis_progress", analysisId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as ProgressUpdate;
          setProgress(data);
          setLoading(false);

          if (data.status === "complete") {
            setIsComplete(true);
          } else if (data.status === "failed") {
            setIsFailed(true);
          }
        } else {
          setProgress(null);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to progress:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [analysisId]);

  return {
    progress,
    loading,
    error,
    isComplete,
    isFailed,
  };
};

/**
 * Hook for fetching progress once (non-realtime)
 */
export const useProgressSnapshot = (analysisId: string | null) => {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!analysisId) return null;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, "analysis_progress", analysisId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as ProgressUpdate;
        setProgress(data);
        return data;
      } else {
        setProgress(null);
        return null;
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching progress:", error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchProgress();
  }, [analysisId, fetchProgress]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  };
};
