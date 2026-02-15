import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChatMessage } from "@/hooks/use-chat-session";

interface ExportOptions {
  title?: string;
  format?: "pdf" | "json" | "csv";
  includeTimestamps?: boolean;
}

export async function exportChat(
  messages: ChatMessage[],
  options: ExportOptions = {}
) {
  const {
    title = "Chat Export",
    format = "pdf",
    includeTimestamps = true,
  } = options;

  switch (format) {
    case "pdf":
      return exportToPDF(messages, title, includeTimestamps);
    case "json":
      return exportToJSON(messages, title);
    case "csv":
      return exportToCSV(messages, title);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

function exportToPDF(messages: ChatMessage[], title: string, includeTimestamps: boolean) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 10;

  // Title
  doc.setFontSize(18);
  doc.text(title, 10, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleString()}`, 10, yPosition);
  yPosition += 10;

  // Messages
  doc.setFontSize(11);
  messages.forEach((msg) => {
    const content = msg.role === "user" ? msg.content : "Analysis Result";
    const role = msg.role === "user" ? "You" : "FactPlus";

    // Check if we need a new page
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 10;
    }

    // Message header
    doc.setFont("helvetica", "bold");
    doc.text(`${role}:`, 10, yPosition);
    yPosition += 5;

    // Message content
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(content || "", pageWidth - 20);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 10) {
        doc.addPage();
        yPosition = 10;
      }
      doc.text(line, 10, yPosition);
      yPosition += 5;
    });

    // Timestamp
    if (includeTimestamps && msg.timestamp) {
      doc.setFontSize(8);
      doc.setTextColor(128);
      const date = new Date(msg.timestamp).toLocaleString();
      doc.text(date, 10, yPosition);
      doc.setTextColor(0);
      yPosition += 5;
    }

    yPosition += 5; // Space between messages
  });

  // Save PDF
  doc.save(`${title}-${Date.now()}.pdf`);
}

function exportToJSON(messages: ChatMessage[], title: string) {
  const data = {
    title,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      type: msg.type,
      timestamp: msg.timestamp,
      formattedDate: new Date(msg.timestamp).toLocaleString(),
    })),
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToCSV(messages: ChatMessage[], title: string) {
  const headers = ["Role", "Content", "Type", "Timestamp", "Date"];
  const rows = messages.map((msg) => [
    msg.role,
    (msg.content || "").replace(/"/g, '""'), // Escape quotes
    msg.type || "",
    msg.timestamp,
    new Date(msg.timestamp).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
