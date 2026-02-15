import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Paperclip, X, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface InputSectionProps {
  onAnalyze: (text: string, files?: File[]) => void;
  onStop?: () => void;
  isAnalyzing: boolean;
}

export function InputSection({ onAnalyze, onStop, isAnalyzing }: InputSectionProps) {
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachedFiles.length > 0) {
      onAnalyze(input, attachedFiles.length > 0 ? attachedFiles : undefined);
      setInput("");
      setAttachedFiles([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/plain'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max per file
      if (!isValidSize) {
        toast.error(`File ${file.name} is too large (max 10MB)`);
      }
      return isValidType && isValidSize;
    });
    
    if (validFiles.length + attachedFiles.length > 5) {
      toast.error("Maximum 5 files per analysis");
      return;
    }
    
    setAttachedFiles([...attachedFiles, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10"
      >
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          
          <div className="relative bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-2">
            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="px-4 pt-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="hover:text-blue-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-center gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask FactPlus to verify a claim, analyze a document, or check a URL..."
                className="w-full bg-transparent border-none text-white placeholder:text-muted-foreground/50 focus:ring-0 px-4 py-2 min-h-[40px] resize-none font-sans text-base"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between px-2 pb-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg text-muted-foreground hover:text-white hover:bg-white/5"
                title="Attach files (images, PDFs, documents)"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button 
                type={isAnalyzing ? "button" : "submit"}
                onClick={isAnalyzing && onStop ? onStop : undefined}
                disabled={(!input.trim() && attachedFiles.length === 0) || (isAnalyzing && !onStop)}
                size="sm"
                className={isAnalyzing && onStop ? "rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold" : "rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_-5px_hsl(var(--primary)/0.5)]"}
              >
                {isAnalyzing ? (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
