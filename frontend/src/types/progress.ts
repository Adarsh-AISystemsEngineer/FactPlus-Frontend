/**
 * Client-side type definitions for progress tracking
 */

export interface FirestoreProgress {
  sessionId: string;
  userId: string;
  claimText: string;
  stage: string;
  progress: number;
  currentAgent: string;
  status: "processing" | "complete" | "failed" | "cancelled";
  startedAt: Date | any;
  updatedAt: Date | any;
  completedAt?: Date | any;
  partialResults?: Record<string, any>;
  errors?: string[];
  estimatedTimeRemaining?: number;
}
