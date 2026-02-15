
/**
 * Report Download Component
 * Handles PDF report generation and download
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateReportAsync, downloadReportAsync, type AnalysisResponse } from "@/lib/api";
import { toast } from "sonner";

interface ReportDownloadProps {
  analysis: AnalysisResponse["data"];
}

export function ReportDownload({ analysis }: ReportDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  if (!analysis || !analysis.canDownloadReport) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await generateReportAsync({
        analysisId: analysis.id,
        analysis: analysis,
      });

      if (response.success && response.data?.reportId) {
        setReportId(response.data.reportId);
        toast.success("Report generated successfully!");
      } else {
        toast.error(response.error || "Failed to generate report");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportId) {
      toast.error("Report ID not available");
      return;
    }

    setIsDownloading(true);
    try {
      await downloadReportAsync(reportId);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5"
    >
      <div className="flex items-center gap-3 mb-3">
        <FileText className="w-5 h-5 text-primary" />
        <div>
          <h4 className="font-semibold">Download Analysis Report</h4>
          <p className="text-sm text-muted-foreground">
            Get a detailed PDF report of this analysis
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {!reportId ? (
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            size="sm"
          >
            {isDownloading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
