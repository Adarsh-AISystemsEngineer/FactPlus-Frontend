
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { ScoreGauge } from "./score-gauge";
import { FeedbackWidget } from "./feedback-widget";
import { ReportDownload } from "./report-download";
import { Badge } from "@/components/ui/badge";
import { type AnalysisResponse } from "@/lib/api";
import { useTypewriter } from "@/hooks/use-typewriter";

interface AnalysisViewProps {
  result: AnalysisResponse | any;
}

export function AnalysisView({ result }: AnalysisViewProps) {
  const [isScoreAnimating, setIsScoreAnimating] = useState(true);
  
  // Extract analysis data - handle both formats
  const analysis = result?.data || result;
  
  // Determine if this is a fresh analysis (has isNew flag) or retrieved from history
  // Fresh analyses will have isNew=true, retrieved ones won't have it
  const isFreshAnalysis = result?.isNew === true;
  
  const { displayedText } = useTypewriter({
    text: result?.data?.summary || result?.summary || "Analysis completed",
    speed: 25,
    delay: isFreshAnalysis ? 600 : 0,
    enabled: isFreshAnalysis, // Only animate if fresh analysis
  });

  // Debug: Log what we received
  console.log("[AnalysisView] received result:", {
    result,
    hasResult: !!result,
    type: typeof result,
    keys: result ? Object.keys(result) : [],
  });

  // Handle both API response format and stored message format
  if (!result || typeof result !== 'object') {
    console.log("[AnalysisView] RENDERING NULL: result is falsy or not an object");
    return null;
  }

  // Extract analysis data - handle both formats
  // API response format: { success, data: {...}, isDegradedMode }
  // Stored format: already-transformed analysis data
  const isDegradedMode = result.isDegradedMode || false;

  console.log("[AnalysisView] extracted analysis:", {
    analysis,
    credibilityScore: analysis?.credibilityScore,
    summary: analysis?.summary,
    isDegradedMode,
  });

  // Validate we have required fields
  if (!analysis.credibilityScore && !analysis.summary) {
    console.log("[AnalysisView] RENDERING NULL: missing credibilityScore and summary");
    return null;
  }
  
  // Ensure minimum viable data for rendering (especially in degraded mode)
  const credibilityScore = analysis.credibilityScore ?? 50;
  const verdict = analysis.verdict ?? "UNVERIFIABLE";
  const summary = analysis.summary ?? "Analysis completed";
  const evidence = Array.isArray(analysis.evidence) ? analysis.evidence : [];
  const relatedTopics = Array.isArray(analysis.relatedTopics) ? analysis.relatedTopics : [];
  const nodes = Array.isArray(analysis.nodes) ? analysis.nodes : [];
  
  console.log("[AnalysisView] RENDERING with data:", {
    credibilityScore,
    verdict,
    summaryLength: summary.length,
    evidenceCount: evidence.length,
  });
  
  return (
    <div className="container mx-auto px-4 pb-20">
      {/* Degraded Mode Warning */}
      {isDegradedMode && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-amber-300/30 bg-amber-50/5 flex gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-200">Limited Analysis Mode</p>
            <p className="text-xs text-amber-300 mt-1">Some verification services unavailable. Results may be provisional.</p>
          </div>
        </motion.div>
      )}

      {/* Cached Analysis Indicator */}
      {analysis.cached && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-xl border border-blue-300/30 bg-blue-50/10 flex gap-3 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="text-blue-200">This result was retrieved from cache (instant)</span>
        </motion.div>
      )}
      
      <div className="space-y-8 max-w-2xl mx-auto">
        
        {/* Hero Section: Credibility Score */}
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, duration: 0.8 }}
          onAnimationComplete={() => setIsScoreAnimating(false)}
          className="flex justify-center"
        >
          <motion.div 
            className="w-full max-w-xl glass-panel p-8 rounded-2xl border-l-4 border-l-secondary flex justify-center"
            animate={isScoreAnimating ? { borderColor: "rgba(99, 102, 241, 0.6)" } : {}}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
          >
            <ScoreGauge score={credibilityScore} />
          </motion.div>
        </motion.div>

        {/* Summary Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 rounded-2xl border-l-4 border-l-primary"
        >
          <h2 className="text-2xl font-display font-bold mb-4">Analysis Summary</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {displayedText}
            {displayedText.length < summary.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="ml-1 inline-block"
              >
                ▌
              </motion.span>
            )}
          </p>
        </motion.div>

        {/* Supporting Evidence */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-secondary rounded-full" />
            Supporting Evidence ({evidence.length} sources)
          </h3>
          {evidence && evidence.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidence.map((source, index) => (
                <a 
                  key={index}
                  href={source.source_url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white text-sm group-hover:text-primary transition-colors line-clamp-2 flex-1">
                      {source.source_name}
                    </h4>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </div>
                  {source.quote && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2 italic">
                      "{source.quote}"
                    </p>
                  )}
                  {source.relevance && (
                    <p className="text-xs text-blue-300 mb-2">
                      <strong>Relevance:</strong> {source.relevance}
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {source.source_url}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center text-muted-foreground">
              No sources found for this claim
            </div>
          )}
        </motion.div>

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-3">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((topic, idx) => (
                <Badge key={idx} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {topic}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Download Report Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-4 rounded-xl border border-white/10 border-l-4 border-l-primary w-full"
        >
          <ReportDownload analysis={analysis} />
        </motion.div>

        {/* Footer: Feedback */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4 border-t border-white/10"
        >
          <FeedbackWidget analysis={analysis} />
        </motion.div>

      </div>
    </div>
  );
}
