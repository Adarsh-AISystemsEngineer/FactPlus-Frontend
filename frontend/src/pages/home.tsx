import { useState, useCallback } from "react";
import { Navbar } from "@/components/fact-check/navbar";
import { InputSection } from "@/components/fact-check/input-section";
import { AnalysisView } from "@/components/fact-check/analysis-view";
import { AnalysisLoadingSkeleton } from "@/components/fact-check/analysis-loading";
import { RecentChecks } from "@/components/fact-check/recent-checks";
import { analyzeClaimAsync, type AnalysisResponse } from "@/lib/api";
import { toast } from "sonner";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const handleAnalyze = useCallback(async (text: string, files?: File[]) => {
    if (!text.trim()) {
      toast.error("Please enter a claim to analyze");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const response = await analyzeClaimAsync({
        claim: text.trim(),
        context: files ? `Files attached: ${files.map(f => f.name).join(", ")}` : undefined,
        forceRefresh: false,
      });

      setResult(response);
      
      if (response.success && response.data) {
        toast.success("Analysis complete!");
      } else {
        toast.error(response.error || "Analysis failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
      setResult({
        success: false,
        error: message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/30 text-foreground">
      <Navbar />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        {isAnalyzing ? (
          <AnalysisLoadingSkeleton />
        ) : (
          <>
            <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-700 ${result ? 'min-h-[30vh] md:min-h-[30vh] pt-10' : 'min-h-[50vh] md:min-h-[50vh]'}`}>
              <InputSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
            </div>

            {/* Show Recent Checks only if no result */}
            {!result && (
              <div className="transition-opacity duration-500">
                <RecentChecks />
              </div>
            )}

            <AnalysisView result={result} />
          </>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-white/5 bg-background/50">
        <p>&copy; 2026 FactPlus AI. Dedicated to truth and clarity.</p>
      </footer>
    </div>
  );
}