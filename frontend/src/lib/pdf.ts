// client/src/lib/pdf.ts
import jsPDF from "jspdf";

export interface ReportData {
  claimText: string;
  summary: string;
  evidence: string[];
  sources: any[];
  verdict: string;
  credibilityScore: number;
}

export async function generatePDFReport(data: ReportData): Promise<Blob> {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(30, 64, 175); // Blue color
    pdf.text("FactPlus Analysis Report", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Claim Section
    pdf.setFontSize(14);
    pdf.setTextColor(30, 64, 175);
    pdf.text("Claim", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    const claimLines = pdf.splitTextToSize(data.claimText, contentWidth);
    pdf.text(claimLines, margin, yPosition);
    yPosition += claimLines.length * 6 + 10;

    // Credibility Score Section
    pdf.setFontSize(14);
    pdf.setTextColor(30, 64, 175);
    pdf.text("Credibility Score", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(20);
    pdf.setTextColor(5, 150, 105); // Green color
    pdf.text(`${(data.credibilityScore * 100).toFixed(1)}%`, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Verdict: ${data.verdict}`, margin, yPosition);
    yPosition += 10;

    // Summary Section
    pdf.setFontSize(14);
    pdf.setTextColor(30, 64, 175);
    pdf.text("Summary", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    const summaryLines = pdf.splitTextToSize(data.summary, contentWidth);
    pdf.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 6 + 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Evidence Section
    pdf.setFontSize(14);
    pdf.setTextColor(30, 64, 175);
    pdf.text("Evidence", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    data.evidence.forEach((item, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      const evidenceLines = pdf.splitTextToSize(
        `${index + 1}. ${item}`,
        contentWidth - 5
      );
      pdf.text(evidenceLines, margin + 5, yPosition);
      yPosition += evidenceLines.length * 5 + 2;
    });

    yPosition += 5;

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Sources Section
    pdf.setFontSize(14);
    pdf.setTextColor(30, 64, 175);
    pdf.text("Sources", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    data.sources.forEach((source) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      const title = source.title || "Source";
      const titleLines = pdf.splitTextToSize(title, contentWidth - 5);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "bold");
      pdf.text(titleLines, margin + 5, yPosition);
      yPosition += titleLines.length * 5;

      pdf.setFont(undefined, "normal");
      pdf.setTextColor(2, 132, 199); // Blue color for URL
      const urlLines = pdf.splitTextToSize(source.url || "No URL", contentWidth - 5);
      pdf.text(urlLines, margin + 5, yPosition);
      yPosition += urlLines.length * 5 + 4;
    });

    // Footer
    const footerY = pageHeight - 10;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Generated on ${new Date().toLocaleString()} | FactPlus - Real-time Credibility Analysis Engine`,
      pageWidth / 2,
      footerY,
      { align: "center" }
    );

    // Convert PDF to Blob
    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } catch (error) {
    console.error("Error generating PDF report:", error);
    throw new Error(
      `Failed to generate PDF report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
