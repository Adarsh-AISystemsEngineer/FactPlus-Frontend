import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { chatService } from "@/lib/firestore-service";

export interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  analysisResult?: any;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  timestamp: number;
}

export function useChatSession(initialChatId?: string) {
  const { user } = useAuthContext();
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [chatTitle, setChatTitle] = useState<string>("New Chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing chat or create new one
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const initChat = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (initialChatId) {
          // Load existing chat and set up real-time listener
          const existingChat = await chatService.getChat(initialChatId);
          if (existingChat) {
            setChatId(initialChatId);
            setChatTitle(existingChat.title);
            
            console.log("[useChatSession] Loaded chat:", {
              chatId: initialChatId,
              messageCount: existingChat.messages?.length || 0,
              messages: existingChat.messages?.map((m, i) => ({
                index: i,
                role: m.role,
                hasAnalysisResult: !!m.analysisResult,
                analysisResultKeys: m.analysisResult ? Object.keys(m.analysisResult) : [],
              })),
            });
            
            setMessages(existingChat.messages || []);
            
            // Set up real-time listener for updates from other devices/tabs
            unsubscribe = chatService.onChatUpdated(initialChatId, (updatedChat) => {
              if (updatedChat) {
                console.log("[useChatSession] Chat updated via listener:", {
                  messageCount: updatedChat.messages?.length || 0,
                });
                setChatTitle(updatedChat.title);
                setMessages(updatedChat.messages || []);
              }
            });
          } else {
            setError("Chat not found");
          }
        } else {
          // Create new chat session with timestamp (date only)
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
          const shortTitle = `Chat - ${dateStr}`;
          
          const newChatId = await chatService.createChat(
            user.uid,
            shortTitle
          );
          
          setChatId(newChatId);
          setChatTitle(shortTitle);
          setMessages([]);
        }
      } catch (err: any) {
        console.error("Error initializing chat:", err);
        setError(err.message || "Failed to initialize chat");
      } finally {
        setLoading(false);
      }
    };

    initChat();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, initialChatId]);

  // Auto-update chat title based on first message
  useEffect(() => {
    if (!chatId || messages.length !== 1) return;
    
    const firstMessage = messages[0];
    if (firstMessage.role === "user" && firstMessage.content) {
      const preview = firstMessage.content.substring(0, 50);
      const newTitle = preview.length < firstMessage.content.length 
        ? preview + "..." 
        : preview;
      
      updateChatTitle(newTitle);
    }
  }, [messages.length, chatId]);

  const updateChatTitle = async (newTitle: string) => {
    if (!chatId) return;
    
    try {
      setChatTitle(newTitle);
      await chatService.updateChat(chatId, { title: newTitle });
    } catch (err: any) {
      console.error("Error updating chat title:", err);
    }
  };

  const addMessage = async (message: Omit<ChatMessage, "timestamp">) => {
    if (!chatId) {
      setError("No active chat session");
      throw new Error("No active chat session");
    }

    try {
      setIsSaving(true);
      const messageWithTimestamp: ChatMessage = {
        ...message,
        timestamp: Date.now(),
      };
      
      // Save to Firestore - this will trigger real-time listener
      await chatService.addMessage(chatId, messageWithTimestamp);
      
      // Optimistically update local state
      setMessages(prev => [...prev, messageWithTimestamp]);
      
      return messageWithTimestamp;
    } catch (err: any) {
      console.error("Error adding message:", err);
      setError(err.message || "Failed to add message");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    chatId,
    chatTitle,
    messages,
    loading,
    isSaving,
    error,
    addMessage,
    updateChatTitle,
    clearError: () => setError(null),
  };
}
