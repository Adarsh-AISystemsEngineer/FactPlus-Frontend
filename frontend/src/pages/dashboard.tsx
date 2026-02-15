import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuthContext } from "@/contexts/auth-context";
import { chatService, claimService, analysisService } from "@/lib/firestore-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/fact-check/navbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Trash2, MessageCircle, Clock, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Chat, Claim } from "@shared/firebase-schema";
import { QueryDocumentSnapshot } from "firebase/firestore";

function DashboardContent() {
  const { user } = useAuthContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [verifiedClaims, setVerifiedClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  // Pagination state for claims only
  const [claimPage, setClaimPage] = useState(0);
  const [claimLastVisible, setClaimLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreClaims, setHasMoreClaims] = useState(true);
  // Dummy chat pagination state to avoid ReferenceError
  const [chatLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreChats] = useState(false); // Real-time updates, so no load more
  const PAGE_SIZE = 10;

  // Track navigation
  useEffect(() => {
    sessionStorage.setItem('previousPath', '/dashboard');
  }, []);

  // Real-time chat updates - only show chats with conversations
  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsubscribe = chatService.onUserChatsUpdated(user.uid, (chats) => {
      // Filter out chats that have no messages (idle chats)
      const chatsWithConversations = chats.filter((chat) => chat.messages && chat.messages.length > 0);
      setChats(chatsWithConversations);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Load claims with pagination (not real-time) and filter verified claims
  useEffect(() => {
    if (!user?.uid) return;
    const loadClaims = async () => {
      try {
        setLoading(true);
        const claimsData = await claimService.getUserClaimsPaginated(user.uid, PAGE_SIZE * 5); // get more for filtering
        setClaims(claimsData.claims || []);
        setClaimLastVisible(claimsData.lastVisible);
        setHasMoreClaims(claimsData.claims.length === PAGE_SIZE);
        // Filter verified claims (score >= 80)
        const verified = (claimsData.claims || []).filter(
          (claim) => claim.analysisResult && claim.analysisResult.score >= 80
        );
        setVerifiedClaims(verified);
      } catch (error: any) {
        toast.error("Failed to load your claims");
      } finally {
        setLoading(false);
      }
    };
    loadClaims();
  }, [user?.uid]);

  const loadMoreChats = async () => {
    if (!user?.uid || !chatLastVisible) return;

    try {
      const data = await chatService.getUserChatsPaginated(user.uid, PAGE_SIZE, chatLastVisible);
      setChats((prev) => [...prev, ...data.chats]);
      setChatLastVisible(data.lastVisible);
      setHasMoreChats(data.chats.length === PAGE_SIZE);
      setChatPage((prev) => prev + 1);
    } catch (error: any) {
      toast.error("Failed to load more chats");
    }
  };

  const loadMoreClaims = async () => {
    if (!user?.uid || !claimLastVisible) return;

    try {
      const data = await claimService.getUserClaimsPaginated(user.uid, PAGE_SIZE, claimLastVisible);
      setClaims((prev) => [...prev, ...data.claims]);
      setClaimLastVisible(data.lastVisible);
      setHasMoreClaims(data.claims.length === PAGE_SIZE);
      setClaimPage((prev) => prev + 1);
    } catch (error: any) {
      toast.error("Failed to load more claims");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      setDeleting(chatId);
      const id = toast.loading("Deleting chat...");
      await chatService.deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      toast.dismiss(id);
      toast.success("Chat deleted successfully");
    } catch (error: any) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    try {
      setDeleting(claimId);
      const id = toast.loading("Deleting claim...");
      await claimService.deleteClaim(claimId);
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      toast.dismiss(id);
      toast.success("Claim deleted successfully");
    } catch (error: any) {
      console.error("Error deleting claim:", error);
      toast.error("Failed to delete claim");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/10 bg-background/50 backdrop-blur-sm px-6 py-3">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', active: true }
          ]}
        />
      </div>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Your Dashboard</h1>
            <p className="text-muted-foreground">Manage your fact-checks and conversations</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Loading skeleton for chats */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Recent Conversations
                  </h2>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="border-white/10 bg-card/50 backdrop-blur">
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Loading skeleton for claims */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Recent Claims
                  </h2>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="border-white/10 bg-card/50 backdrop-blur">
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Chats */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Recent Conversations
                  </h2>
                  <span className="text-sm text-muted-foreground">{chats.length} total</span>
                </div>

                {chats.length === 0 ? (
                  <Card className="border-white/10 bg-card/50 backdrop-blur">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">No conversations yet</p>
                      <Link href="/chat">
                        <Button className="gap-2">
                          Start Your First Chat
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="mb-4 bg-background/80 rounded-lg" style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                    <div className="space-y-3 pr-2">
                      {chats.map((chat) => (
                        <Card
                          key={chat.id}
                          className="border-white/10 bg-card/50 backdrop-blur hover:bg-card/70 transition-colors cursor-pointer group"
                        >
                          <CardContent className="p-4 flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <Link href={`/chat/${chat.id}`}>
                                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                  {chat.title || "Untitled Chat"}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(chat.createdAt).toLocaleDateString()}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {chat.messages?.length || 0} messages
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteChat(chat.id);
                              }}
                              disabled={deleting === chat.id}
                              className="ml-2 p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                              title="Delete chat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Verified Claims */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Verified Claims
                  </h2>
                  <span className="text-sm text-muted-foreground">{verifiedClaims.length} verified</span>
                </div>

                {verifiedClaims.length === 0 ? (
                  <Card className="border-white/10 bg-card/50 backdrop-blur">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">No verified claims yet</p>
                      <Link href="/chat">
                        <Button className="gap-2">
                          Analyze Your First Claim
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {verifiedClaims.map((claim) => (
                        <Card
                          key={claim.id}
                          className="border-white/10 bg-card/50 backdrop-blur hover:bg-green-900/40 transition-colors group"
                        >
                          <CardContent className="p-4 flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                {claim.text}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-green-400 mt-2">
                                <Clock className="w-3 h-3" />
                                {new Date(claim.createdAt).toLocaleDateString()}
                                <span className="ml-2">Score: {claim.analysisResult?.score}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteClaim(claim.id)}
                              disabled={deleting === claim.id}
                              className="ml-2 p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                              title="Delete claim"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {hasMoreClaims && (
                      <Button 
                        onClick={loadMoreClaims}
                        variant="outline" 
                        className="w-full border-white/10 gap-2"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Load More
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats Footer */}
          {!loading && (
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="grid grid-cols-3 gap-4 md:gap-8">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold text-primary">
                    {chats.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Conversations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold text-primary">
                    {claims.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Claims Analyzed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold text-primary">
                    {Math.floor((chats.length + claims.length) / 2)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Avg. Items</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
