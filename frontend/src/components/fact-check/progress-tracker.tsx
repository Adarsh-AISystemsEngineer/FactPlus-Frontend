/**
 * Progress Tracker Component
 * Phase 3: Real-time analysis progress display with animations
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import type { FirestoreProgress } from "../../types/progress";

interface ProgressTrackerProps {
  progress: FirestoreProgress | null;
  loading?: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

const STAGE_STEPS = [
  { name: "Input Processing", minProgress: 0, maxProgress: 15 },
  { name: "Claim Extraction", minProgress: 15, maxProgress: 25 },
  { name: "Evidence Gathering", minProgress: 25, maxProgress: 50 },
  { name: "Source Scoring", minProgress: 50, maxProgress: 65 },
  { name: "Reasoning", minProgress: 65, maxProgress: 80 },
  { name: "Credibility Analysis", minProgress: 80, maxProgress: 90 },
  { name: "Graph Building", minProgress: 90, maxProgress: 100 },
];

export const ProgressTrackerComponent: React.FC<ProgressTrackerProps> = ({
  progress,
  loading = true,
  onComplete,
  onError,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Animate progress bar
  useEffect(() => {
    if (!progress) return;

    const targetProgress = progress.progress || 0;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * targetProgress, targetProgress);

      setDisplayProgress(progress);

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [progress?.progress]);

  // Update estimated time
  useEffect(() => {
    if (!progress?.estimatedTimeRemaining) {
      setEstimatedTimeRemaining(null);
      return;
    }

    setEstimatedTimeRemaining(progress.estimatedTimeRemaining);

    const interval = setInterval(() => {
      setEstimatedTimeRemaining((prev) =>
        prev && prev > 0 ? prev - 1 : null
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [progress?.estimatedTimeRemaining]);

  // Handle completion
  useEffect(() => {
    if (progress?.status === "complete" && onComplete) {
      onComplete();
    }
  }, [progress?.status]);

  // Handle errors
  useEffect(() => {
    if (progress?.status === "failed" && progress?.errors?.[0] && onError) {
      onError(progress.errors[0]);
    }
  }, [progress?.status]);

  if (!progress) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-gray-500"
      >
        <p>No analysis in progress</p>
      </motion.div>
    );
  }

  const currentStage = STAGE_STEPS.find(
    (step) =>
      displayProgress >= step.minProgress && displayProgress < step.maxProgress
  ) || STAGE_STEPS[STAGE_STEPS.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis In Progress</h2>
          <p className="text-gray-600 mt-1">Analyzing: {progress.claimText}</p>
        </div>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-blue-500"
        >
          <Zap className="w-6 h-6" />
        </motion.div>
      </div>

      {/* Main Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold text-gray-900">{currentStage.name}</h3>
          <span className="text-2xl font-bold text-blue-600">{Math.round(displayProgress)}%</span>
        </div>

        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"
          />
        </div>
      </motion.div>

      {/* Stage Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h4 className="text-sm font-semibold text-gray-700">Analysis Stages</h4>
        <div className="space-y-2">
          {STAGE_STEPS.map((step, index) => {
            const isCompleted = displayProgress >= step.maxProgress;
            const isCurrentStage =
              displayProgress >= step.minProgress && displayProgress < step.maxProgress;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isCompleted
                    ? "bg-green-50"
                    : isCurrentStage
                      ? "bg-blue-50"
                      : "bg-gray-50"
                }`}
              >
                <motion.div
                  animate={isCurrentStage ? { scale: 1.2 } : { scale: 1 }}
                  transition={{ duration: 0.5, repeat: isCurrentStage ? Infinity : 0 }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : isCurrentStage ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5 text-blue-600" />
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </motion.div>

                <span
                  className={`text-sm font-medium transition-colors ${
                    isCompleted
                      ? "text-green-700"
                      : isCurrentStage
                        ? "text-blue-700"
                        : "text-gray-600"
                  }`}
                >
                  {step.name}
                </span>

                <div className="flex-1" />

                {isCurrentStage && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-semibold px-2 py-1 bg-blue-200 text-blue-800 rounded"
                  >
                    Running
                  </motion.span>
                )}

                {isCompleted && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-semibold px-2 py-1 bg-green-200 text-green-800 rounded"
                  >
                    Done
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Agent and Metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Current Agent</p>
          <p className="text-lg font-semibold text-gray-900">{progress.currentAgent}</p>
        </div>

        {estimatedTimeRemaining !== null && (
          <div className="flex items-center gap-2 text-right">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Estimated Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {estimatedTimeRemaining > 60
                  ? `${Math.floor(estimatedTimeRemaining / 60)}m ${estimatedTimeRemaining % 60}s`
                  : `${estimatedTimeRemaining}s`}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Partial Results */}
      {progress.partialResults && Object.keys(progress.partialResults).length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2"
        >
          <p className="text-sm font-semibold text-blue-900">Intermediate Results</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(progress.partialResults).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-blue-800 capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                </span>
                <span className="font-semibold text-blue-900">{String(value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {progress.status === "failed" && progress.errors && progress.errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Analysis Failed</p>
            <p className="text-sm text-red-800 mt-1">{progress.errors[0]}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
