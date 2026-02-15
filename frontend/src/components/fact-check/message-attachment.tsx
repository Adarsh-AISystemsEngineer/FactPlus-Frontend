
import { File, FileImage, FileText } from "lucide-react";

interface Attachment {
  name: string;
  type: string;
  size: number;
  data?: string;
}

interface MessageAttachmentProps {
  attachments: Attachment[];
}

export function MessageAttachment({ attachments }: MessageAttachmentProps) {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="w-4 h-4" />;
    if (type === "application/pdf") return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((attachment, index) => (
        <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          {getFileIcon(attachment.type)}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-white truncate max-w-[150px]">
              {attachment.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(attachment.size)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
