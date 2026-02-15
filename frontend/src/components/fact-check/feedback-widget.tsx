
/**
 * Feedback Widget Component
 * Allows users to provide feedback on analysis results
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitFeedbackAsync, type AnalysisResponse } from "@/lib/api";
import { toast } from "sonner";

interface FeedbackWidgetProps {
  analysis: AnalysisResponse["data"];
  onSubmitted?: () => void;
}

/**
 * Generate SHA256 hash using Web Crypto API (browser-compatible)
 */
async function generateClaimHash(claim: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(claim);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function FeedbackWidget({ analysis, onSubmitted }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVerdict, setUserVerdict] = useState<string | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [claimHash, setClaimHash] = useState<string>("");

  // Generate hash when analysis is available
  if (!analysis) return null;

  // Generate hash on first load
  if (!claimHash && analysis.claim) {
    generateClaimHash(analysis.claim).then(setClaimHash);
  }

  const handleSubmit = async () => {
    if (!userVerdict || userScore === null) {
      toast.error("Please select both a verdict and score");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFeedbackAsync({
        analysisId: analysis.id,
        claimHash: claimHash,
        systemVerdict: analysis.verdict,
        systemScore: analysis.credibilityScore,
        userVerdict,
        userScore,
        userNote: note || undefined,
      });

      if (result.success) {
        setIsOpen(false);
        setUserVerdict(null);
        setUserScore(null);
        setNote("");
        onSubmitted?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 items-center justify-center py-4 border-t border-white/10"
      >
        <span className="text-sm text-muted-foreground">Was this analysis helpful?</span>
        <button
          onClick={() => {
            setUserVerdict(analysis.verdict);
            setUserScore(analysis.credibilityScore);
            setIsOpen(true);
          }}
          className="p-2 hover:bg-green-500/10 rounded-lg text-muted-foreground hover:text-green-500 transition-colors"
          title="Yes, this was helpful"
        >
          <ThumbsUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setUserVerdict("INCORRECT");
            setUserScore(0);
            setIsOpen(true);
          }}
          className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
          title="No, this wasn't helpful"
        >
          <ThumbsDown className="w-5 h-5" />
        </button>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="ml-auto text-xs"
        >
          Detailed Feedback
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback on Analysis</DialogTitle>
            <DialogDescription>
              Help us improve by providing feedback on this analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                Your Assessment
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["TRUE", "MOSTLY_TRUE", "MOSTLY_FALSE", "FALSE"].map((verdict) => (
                  <button
                    key={verdict}
                    onClick={() => {
                      setUserVerdict(verdict);
                      // Adjust score based on verdict
                      const scores: Record<string, number> = {
                        TRUE: 90,
                        MOSTLY_TRUE: 70,
                        MOSTLY_FALSE: 30,
                        FALSE: 10,
                      };
                      setUserScore(scores[verdict] || 50);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      userVerdict === verdict
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {verdict.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Credibility Score (0-100)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={userScore || 50}
                onChange={(e) => setUserScore(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-muted-foreground mt-2">
                {userScore !== null ? userScore : "50"}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Additional Comments (optional)
              </label>
              <Textarea
                placeholder="Share any additional context or corrections..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !userVerdict}
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
