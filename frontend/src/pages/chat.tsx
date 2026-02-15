import { Link, useParams, useLocation } from "wouter";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { InputSection } from "@/components/fact-check/input-section";
import { AnalysisView } from "@/components/fact-check/analysis-view";
import { ProgressTrackerComponent } from "@/components/fact-check/progress-tracker";
import { MessageAttachment } from "@/components/fact-check/message-attachment";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Menu, Network, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRef, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShinyText from "@/components/ui/shiny-text";
import "@/components/ui/shiny-text.css";
import { useAuthContext } from "@/contexts/auth-context";
import { useFactCheck } from "@/hooks/use-fact-check";
import { useProgress } from "@/hooks/use-progress";
import { useChatSession } from "@/hooks/use-chat-session";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { toast } from "sonner";
import logoImage from "@assets/generated_images/futuristic_data-node_eye_logo_for_factplus.png";

function ChatPageContent() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { user, logout } = useAuthContext();
  const { messages, addMessage, loading: sessionLoading, error: chatError, isSaving, chatId, chatTitle } = useChatSession(params.id);
  const factCheckMutation = useFactCheck();
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const { progress } = useProgress(currentAnalysisId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [referrer, setReferrer] = useState<'dashboard' | 'home'>('home');

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect referrer from previous page
  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousPath');
    if (previousPath === '/dashboard') {
      setReferrer('dashboard');
    }
    sessionStorage.setItem('previousPath', '/chat');
  }, []);

  const handleNavigate = (path: string) => {
    sessionStorage.setItem('previousPath', '/chat');
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  const handleAnalyze = async (text: string, files?: File[]) => {
    if (!text.trim() && (!files || files.length === 0)) {
      toast.error("Please enter a claim or attach a file");
      return;
    }

    if (!user?.uid) {
      toast.error("You must be logged in");
      return;
    }

    try {
      // Create file metadata (don't send base64 data to avoid payload size issues)
      const fileMetadata: any[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          fileMetadata.push({
            name: file.name,
            type: file.type,
            size: file.size,
          });
        }
      }

      // Add user message to chat
      try {
        const userMessageData: any = {
          role: "user",
          content: text,
        };
        if (fileMetadata.length > 0) {
          userMessageData.attachments = fileMetadata;
        }
        
        await addMessage(userMessageData);
      } catch (error: any) {
        toast.error("Failed to save your message");
        throw error;
      }

      const toastId = toast.loading("Analyzing claim" + (fileMetadata.length > 0 ? " and attachments" : "") + "...");

      try {
        // Extract previous user claims from chat history for LLM context
        const previousClaims = messages
          .filter(msg => msg.role === "user" && msg.content)
          .map(msg => msg.content)
          .filter((claim, index, arr) => arr.indexOf(claim) === index && claim !== text) // Remove duplicates and current claim
          .slice(-5); // Last 5 unique previous claims for context window
        
        // Call fact-check API with file metadata and claim history
        const result = await factCheckMutation.mutateAsync({
          claim: text,
          attachments: fileMetadata,
          fileCount: fileMetadata.length,
          previousClaims: previousClaims.length > 0 ? previousClaims : undefined,
        });

        // Store the sessionId to track real-time progress
        if (result.sessionId) {
          setCurrentAnalysisId(result.sessionId);
        }

        // Add assistant response with analysis
        try {
          // The hook returns flattened result (spreads result.data into root)
          // So use result directly, not result.data
          const analysisData = result;
          
          console.log("[ChatPage] API Response received:", {
            hasData: !!analysisData,
            dataKeys: analysisData ? Object.keys(analysisData) : [],
            credibilityScore: analysisData?.credibilityScore,
            summary: analysisData?.summary,
            isDegradedMode: analysisData?.isDegradedMode,
          });
          
          // Remove undefined values for Firestore compatibility
          const sanitizedAnalysis = JSON.parse(JSON.stringify(analysisData));
          
          // Mark this as a fresh analysis (just generated, not from history)
          sanitizedAnalysis.isNew = true;
          
          console.log("[ChatPage] Saving message with analysisResult:", {
            hasAnalysisResult: !!sanitizedAnalysis,
            keys: Object.keys(sanitizedAnalysis),
          });
          
          await addMessage({
            role: "assistant",
            analysisResult: sanitizedAnalysis,
          });
        } catch (error: any) {
          console.error("Failed to save analysis:", error);
          toast.error("Analysis saved but failed to display");
        }

        toast.dismiss(toastId);
        toast.success("Analysis complete!");
        setCurrentAnalysisId(null); // Clear progress tracking
      } catch (error: any) {
        toast.dismiss(toastId);
        setCurrentAnalysisId(null);
        throw error;
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      const errorMsg = error?.message || error?.data?.message || "Failed to analyze claim";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-full">
        <AppSidebar className="h-full" />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-white/10 bg-background/50 backdrop-blur-sm sticky top-0 z-10 gap-8">
          {/* Left Section: Breadcrumb */}
          <div className="flex items-center gap-4 min-w-0">
            <Breadcrumb 
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: chatTitle || 'Chat', active: true }
              ]}
              className="flex-1 min-w-0"
            />
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/knowledge-graph">
              <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5">
                <Network className="w-4 h-4" />
                Knowledge Graph
              </Button>
            </Link>
            
            {/* User Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-white/10 hover:bg-white/5"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {user?.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-white/10 bg-background/95 backdrop-blur">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{user?.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-400">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>


        {/* Chat Stream */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-8 py-8">
            {chatError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <p className="font-medium">Error Loading Chat</p>
                <p className="text-xs mt-1">{chatError}</p>
              </div>
            )}

            {sessionLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                  <p className="text-muted-foreground">Loading your chat...</p>
                </div>
              </div>
            )}

            {!sessionLoading && messages.length === 0 && !chatError && (
              <div className="text-center py-20">
                <div className="mb-8">
                  <ShinyText
                    text={`Hello ${user?.displayName?.split(" ")[0] || "there"}, let's get started!`}
                    disabled={false}
                    speed={3}
                    className="text-center justify-center flex"
                  />
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%]">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-sm">
                      {msg.content}
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachment attachments={msg.attachments} />
                    )}
                  </div>
                ) : (
                <div className="w-full">
                    {msg.analysisResult && (
                      <>
                        {console.log("[ChatPage] Rendering assistant message:", {
                          analysisResult: msg.analysisResult,
                          hasAnalysisResult: !!msg.analysisResult,
                          keys: msg.analysisResult ? Object.keys(msg.analysisResult) : [],
                        })}
                        <ErrorBoundary>
                          <AnalysisView result={msg.analysisResult} />
                        </ErrorBoundary>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Real-time progress display */}
            {(factCheckMutation.isPending || progress) && (
              <div className="w-full">
                <ProgressTrackerComponent 
                  progress={progress as any}
                  loading={factCheckMutation.isPending}
                  onComplete={() => {
                    setCurrentAnalysisId(null);
                  }}
                  onError={(error) => {
                    toast.error(error);
                    setCurrentAnalysisId(null);
                  }}
                />
              </div>
            )}

            {factCheckMutation.isPending && !progress && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                <span className="text-xs ml-2">Analyzing claim patterns...</span>
              </div>
            )}

            {isSaving && messages.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>Saving to chat history...</span>
              </div>
            )}

            {factCheckMutation.isError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <p className="font-medium">Analysis Failed</p>
                <p className="text-xs mt-1">{factCheckMutation.error?.message || "Could not analyze the claim"}</p>
              </div>
            )}
            
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-md">
          <InputSection
            onAnalyze={handleAnalyze}
            onStop={() => factCheckMutation.cancel?.()}
            isAnalyzing={factCheckMutation.isPending}
          />
          <div className="text-center mt-2">
            <p className="text-[10px] text-muted-foreground opacity-50">
              FactPlus can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}