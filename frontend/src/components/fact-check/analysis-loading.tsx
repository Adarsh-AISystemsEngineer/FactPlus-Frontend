
/**
 * Analysis Loading Skeleton Component
 * Shows a loading state while analysis is in progress
 */

import { motion } from "framer-motion";

export function AnalysisLoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 pb-20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Skeleton */}
        <div className="space-y-6">
          {/* Score Gauge Skeleton */}
          <div className="rounded-2xl p-6 bg-card/50 border border-white/10">
            <div className="flex justify-center mb-4">
              <motion.div
                className="w-32 h-32 rounded-full border-4 border-white/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mb-2" />
            <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
          </div>

          {/* Graph Skeleton */}
          <div className="rounded-2xl p-4 bg-card/50 border border-white/10 h-64">
            <div className="flex flex-col gap-2 mb-4">
              <div className="h-3 bg-white/10 rounded w-1/3" />
              <div className="h-2 bg-white/5 rounded w-1/4" />
            </div>
            <div className="grid grid-cols-5 gap-2 mt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-full h-4 bg-white/10 rounded"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>

          {/* Status Skeleton */}
          <div className="rounded-2xl p-6 bg-card/50 border border-white/10">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                  <div className="h-2 bg-white/5 rounded w-1/4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Skeleton */}
          <div className="rounded-2xl p-8 bg-card/50 border border-white/10 border-l-4 border-l-primary">
            <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 bg-white/5 rounded w-full" />
              ))}
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          </div>

          {/* Reasoning Skeleton */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <div className="h-5 bg-white/10 rounded w-1/4" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl p-4 bg-card/50 border border-white/10"
                  animate={{ y: [0, 2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-5 rounded-full bg-white/10" />
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                  </div>
                  <div className="space-y-2 pl-8">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="h-3 bg-white/5 rounded w-full" />
                    ))}
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Evidence Skeleton */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-secondary rounded-full" />
              <div className="h-5 bg-white/10 rounded w-1/4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl p-4 bg-card/50 border border-white/10">
                  <div className="flex justify-between mb-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="w-4 h-4 bg-white/5 rounded" />
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="h-2 bg-white/5 rounded w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pulsing Indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">Analyzing claim...</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
