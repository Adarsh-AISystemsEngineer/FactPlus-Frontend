import { Plus, MessageSquare, Settings, LogOut, MoreHorizontal, Trash2, Share2, Archive, Search, Pin, PinOff, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { chatService } from "@/lib/firestore-service";
import { toast } from "sonner";
import { db } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Link } from "wouter";
import logoImage from "@assets/generated_images/futuristic_data-node_eye_logo_for_factplus.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  className?: string;
}

// Helper functions (defined at module level to avoid initialization errors)
function formatChatTitle(title: string): string {
  if (/Chat - \w+ \d{1,2}, \d{4}$/.test(title)) {
    return title;
  }
  
  // Extract date from long format (Chat - 12/28/2025, 1:30:32 PM) to just date part
  const dateMatch = title.match(/(\w+ \d{1,2}, \d{4})/);
  if (dateMatch) {
    return `Chat - ${dateMatch[1]}`;
  }
  
  return title.length > 20 ? title.substring(0, 20) + "..." : title;
}

function getLastMessagePreview(messages: any[] = []): string {
  if (!messages || messages.length === 0) {
    return "";
  }
  
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage.role === "user" && lastMessage.content) {
    const preview = lastMessage.content.substring(0, 40);
    return preview.length < lastMessage.content.length ? preview + "..." : preview;
  }
  
  if (lastMessage.role === "assistant" && lastMessage.analysisResult?.summary) {
    const preview = lastMessage.analysisResult.summary.substring(0, 40);
    return preview.length < lastMessage.analysisResult.summary.length ? preview + "..." : preview;
  }
  
  return "";
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuthContext();
  const [chats, setChats] = useState<any[]>([]);
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Keyboard shortcuts for new chat (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate("/chat");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Load user chats from Firestore with real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Set up real-time listener for user's chats
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userChats = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }));
        setChats(userChats);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading chats:", error);
        toast.error("Failed to load chats");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
      console.error("Logout error:", error);
    }
  };

  const handleDeleteChat = async (chatId: string, chatTitle: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChats(chats.filter((c) => c.id !== chatId));
      toast.success(`Deleted "${chatTitle}"`);
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const handleShareChat = (chatTitle: string) => {
    // Copy share link to clipboard
    const shareText = `Check out my fact-check analysis: "${chatTitle}"`;
    navigator.clipboard.writeText(shareText);
    toast.success("Copied to clipboard");
  };

  const handleArchiveChat = async (chatId: string, chatTitle: string) => {
    try {
      await chatService.updateChat(chatId, { archived: true });
      setChats(chats.filter((c) => c.id !== chatId));
      toast.success(`Archived "${chatTitle}"`);
    } catch (error) {
      console.error("Error archiving chat:", error);
      toast.error("Failed to archive chat");
    }
  };

  const handleUnarchiveChat = async (chatId: string, chatTitle: string) => {
    try {
      await chatService.updateChat(chatId, { archived: false });
      setChats(chats.filter((c) => c.id !== chatId));
      toast.success(`Restored "${chatTitle}"`);
      setShowArchived(false);
    } catch (error) {
      console.error("Error restoring chat:", error);
      toast.error("Failed to restore chat");
    }
  };

  const handlePinChat = (chatId: string) => {
    const newPinned = new Set(pinnedChats);
    if (newPinned.has(chatId)) {
      newPinned.delete(chatId);
      toast.success("Chat unpinned");
    } else {
      newPinned.add(chatId);
      toast.success("Chat pinned to top");
    }
    setPinnedChats(newPinned);
  };

  // Format chat title for display - extract just the essential part
  const formatChatTitle = (title: string): string => {
    // If it's already in short format (Chat - Mon 01, 2025), return as is
    if (/Chat - \w+ \d{1,2}, \d{4}$/.test(title)) {
      return title;
    }
    
    // Extract date from long format (Chat - 12/28/2025, 1:30:32 PM)
    const dateMatch = title.match(/(\w+ \d{1,2}, \d{4})/);
    if (dateMatch) {
      return `Chat - ${dateMatch[1]}`;
    }
    
    // Fallback: truncate to first 20 chars
    return title.length > 20 ? title.substring(0, 20) + "..." : title;
  };

  // Get preview of last message in chat
  const getLastMessagePreview = (messages: any[] = []): string => {
    if (!messages || messages.length === 0) {
      return "";
    }
    
    const lastMessage = messages[messages.length - 1];
    
    // If it's a user message with content
    if (lastMessage.role === "user" && lastMessage.content) {
      const preview = lastMessage.content.substring(0, 40);
      return preview.length < lastMessage.content.length ? preview + "..." : preview;
    }
    
    // If it's an assistant message with analysis
    if (lastMessage.role === "assistant" && lastMessage.analysisResult?.summary) {
      const preview = lastMessage.analysisResult.summary.substring(0, 40);
      return preview.length < lastMessage.analysisResult.summary.length ? preview + "..." : preview;
    }
    
    return "";
  };

  // Filter chats to only show those with messages
  const validChats = chats.filter((chat) => chat.messages && chat.messages.length > 0);
  
  // Separate active and archived chats
  const activeChats = validChats.filter(chat => !chat.archived);
  const archivedChats = validChats.filter(chat => chat.archived);
  
  // Filter based on current view (active or archived)
  const displayChats = showArchived ? archivedChats : activeChats;
  
  // Separate pinned and regular chats, then filter by search
  const pinnedChatsFiltered = displayChats
    .filter(chat => pinnedChats.has(chat.id))
    .filter(chat => 
      formatChatTitle(chat.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getLastMessagePreview(chat.messages).toLowerCase().includes(searchQuery.toLowerCase())
    );

  const regularChatsFiltered = displayChats
    .filter(chat => !pinnedChats.has(chat.id))
    .filter(chat => 
      formatChatTitle(chat.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getLastMessagePreview(chat.messages).toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className={`flex flex-col h-full bg-card/30 backdrop-blur-xl border-r border-white/10 ${className}`}>
      {/* Header / Logo + New Chat + Search */}
      <div className="p-4 space-y-3">
        {/* Logo + Text */}
        <Link href="/" className="flex-shrink-0 inline-flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-primary/50 group-hover:ring-primary transition-all flex-shrink-0">
            <img src={logoImage} alt="FactPlus" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold text-primary">FactPlus</span>
        </Link>

        <Button 
          onClick={() => navigate("/chat")}
          className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none"
          title="Keyboard shortcut: Cmd/Ctrl + K"
        >
          <Plus className="w-4 h-4" />
          New Verification
        </Button>

        {/* Archived Toggle + Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-white/5 border-white/10 placeholder:text-muted-foreground/50"
            />
          </div>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? "bg-primary/20 border-primary/30" : "border-white/10 hover:bg-white/5"}
            title={showArchived ? "Show active chats" : "Show archived chats"}
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-3">
            {loading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Loading chats...</div>
            ) : displayChats.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center py-8">
                {showArchived ? "No archived chats" : "No active chats yet. Start a new verification!"}
              </div>
            ) : (
              <>
                {/* Pinned Chats Section */}
                {pinnedChatsFiltered.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 mb-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider opacity-60">Pinned</h4>
                    </div>
                    <div className="space-y-1">
                      {pinnedChatsFiltered.map((chat) => (
                        <ChatListItem
                          key={chat.id}
                          chat={chat}
                          isActive={currentChatId === chat.id}
                          isPinned={true}
                          onNavigate={() => {
                            setCurrentChatId(chat.id);
                            navigate(`/chat/${chat.id}`);
                          }}
                          onPin={() => handlePinChat(chat.id)}
                          onShare={() => handleShareChat(chat.title)}
                          onArchive={showArchived ? (() => handleUnarchiveChat(chat.id, chat.title)) : (() => handleArchiveChat(chat.id, chat.title))}
                          onDelete={() => handleDeleteChat(chat.id, chat.title)}
                          isArchived={showArchived}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Chats Section */}
                {regularChatsFiltered.length > 0 && (
                  <div>
                    {pinnedChatsFiltered.length > 0 && (
                      <div className="px-3 py-1.5 mb-1">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider opacity-60">Recent</h4>
                      </div>
                    )}
                    <div className="space-y-1">
                      {regularChatsFiltered.map((chat) => (
                        <ChatListItem
                          key={chat.id}
                          chat={chat}
                          isActive={currentChatId === chat.id}
                          isPinned={false}
                          onNavigate={() => {
                            setCurrentChatId(chat.id);
                            navigate(`/chat/${chat.id}`);
                          }}
                          onPin={() => handlePinChat(chat.id)}
                          onShare={() => handleShareChat(chat.title)}
                          onArchive={showArchived ? (() => handleUnarchiveChat(chat.id, chat.title)) : (() => handleArchiveChat(chat.id, chat.title))}
                          onDelete={() => handleDeleteChat(chat.id, chat.title)}
                          isArchived={showArchived}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchQuery && pinnedChatsFiltered.length === 0 && regularChatsFiltered.length === 0 && (
                  <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                    No chats match "{searchQuery}"
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Chat List Item Component
interface ChatListItemProps {
  chat: any;
  isActive: boolean;
  isPinned: boolean;
  onNavigate: () => void;
  onPin: () => void;
  onShare: () => void;
  isArchived?: boolean;
  onArchive: () => void;
  onDelete: () => void;
}

function ChatListItem({
  chat,
  isActive,
  isPinned,
  onNavigate,
  onPin,
  isArchived = false,
  onShare,
  onArchive,
  onDelete,
}: ChatListItemProps) {
  const preview = getLastMessagePreview(chat.messages);

  return (
    <div
      className={`group flex flex-col gap-1 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
        isActive
          ? "bg-primary/20 text-white border border-primary/30"
          : "text-muted-foreground hover:text-white hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "opacity-50 group-hover:opacity-100"}`} />
          <button
            onClick={onNavigate}
            className="truncate flex-1 text-left hover:underline min-w-0"
            title={chat.title}
          >
            {formatChatTitle(chat.title)}
          </button>
        </div>

        {/* Three-dot menu - visible on hover or when active */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 flex-shrink-0 transition-opacity opacity-100`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-white/10">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onPin}
            >
              {isPinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin to Top
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onArchive}
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="text-destructive cursor-pointer focus:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Message preview - only show if there's content */}
      {preview && (
        <div className="px-0 py-1 text-xs text-muted-foreground/70 truncate">
          {preview}
        </div>
      )}
    </div>
  );
}