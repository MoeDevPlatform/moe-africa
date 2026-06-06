import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Mic, Paperclip, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { messagingService } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isCustomer: boolean;
  type: "text" | "image" | "voice" | "file";
  attachmentUrl?: string;
  attachmentName?: string;
  /** Server-confirmed delivery timestamp (recipient received). */
  deliveredAt?: string | null;
  /** Server-confirmed read timestamp. */
  readAt?: string | null;
  status?: "sending" | "sent" | "failed";
  serverId?: number;
}

interface ChatThreadProps {
  providerId: number;
  providerName: string;
  /** Pre-resolved conversation id (preferred — skips lookup). */
  initialConversationId?: number;
  /** Compact layout for small containers (e.g. modal use). */
  compact?: boolean;
}

/**
 * Full-page chat surface used by /marketplace/messages/:conversationId.
 * Self-contained copy of the modal chat body — keeps the existing
 * MessagingModal untouched for now (conservative extraction per plan).
 */
const ChatThread = ({ providerId, providerName, initialConversationId, compact }: ChatThreadProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId ?? null);
  const { user } = useAuth();
  const isSelfChat =
    user?.role === "artisan" && user?.artisanProfile?.id === providerId;
  const userScope = user?.id != null ? String(user.id) : "guest";
  const convKey = `conversation_${userScope}_${providerId}`;
  const listKey = `conversations_${userScope}`;

  // Load local cache for fast paint.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(convKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
            type: m.type || "text",
            readAt: m.readAt ?? null,
            deliveredAt: m.deliveredAt ?? null,
            status: m.status ?? "sent",
          })),
        );
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, [convKey]);

  // Resolve conversation id if not provided.
  useEffect(() => {
    if (initialConversationId) {
      setConversationId(initialConversationId);
      return;
    }
    let cancelled = false;
    messagingService
      .listConversations()
      .then((res) => {
        if (cancelled) return;
        const match = (res?.data ?? []).find((c) => c.providerId === providerId);
        if (match?.id) setConversationId(match.id);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [providerId, initialConversationId]);

  // Mark conversation read on open (Issue #2).
  useEffect(() => {
    if (!conversationId) return;
    messagingService.markRead(conversationId).catch(() => { /* silent */ });
  }, [conversationId]);

  // Poll messages every 5s for delivered/read updates and new inbound text.
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    const fetchOnce = () => {
      messagingService
        .getMessages(conversationId)
        .then((res) => {
          if (cancelled) return;
          const serverMessages = res?.data ?? [];
          if (!Array.isArray(serverMessages)) return;
          setMessages((prev) => {
            const byServerId = new Map<number, number>();
            prev.forEach((m, i) => {
              if (m.serverId != null) byServerId.set(m.serverId, i);
            });
            const next = [...prev];
            let changed = false;
            for (const m of serverMessages as any[]) {
              const sid = Number(m.id);
              const mapped: ChatMessage = {
                id: `srv_${sid}`,
                serverId: sid,
                senderId: m.senderId != null ? String(m.senderId) : String(providerId),
                senderName: m.senderName ?? (m.senderType === "customer" ? "You" : providerName),
                text: m.content ?? m.text ?? "",
                timestamp: m.sentAt ? new Date(m.sentAt) : m.createdAt ? new Date(m.createdAt) : new Date(),
                isCustomer: m.senderType === "customer",
                type: "text",
                deliveredAt: m.deliveredAt ?? null,
                readAt: m.readAt ?? null,
                status: "sent",
              };
              if (byServerId.has(sid)) {
                const idx = byServerId.get(sid)!;
                const existing = next[idx];
                if (existing.readAt !== mapped.readAt || existing.deliveredAt !== mapped.deliveredAt) {
                  next[idx] = { ...existing, readAt: mapped.readAt, deliveredAt: mapped.deliveredAt };
                  changed = true;
                }
              } else {
                next.push(mapped);
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        })
        .catch(() => { /* silent */ });
    };

    fetchOnce();
    const id = window.setInterval(fetchOnce, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [conversationId, providerId, providerName]);

  // Persist locally.
  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(convKey, JSON.stringify(messages)); } catch { /* noop */ }

      // Mirror MessagingModal: also upsert into the conversations list so
      // the /marketplace/messages index can render this thread.
      try {
        const list = JSON.parse(localStorage.getItem(listKey) || "[]");
        const last = messages[messages.length - 1];
        const entry = {
          id: conversationId ?? undefined,
          providerId,
          providerName,
          lastMessage: last.text || (last.type === "image" ? "📷 Image" : last.type === "voice" ? "🎤 Voice message" : last.type === "file" ? "📎 File" : ""),
          lastMessageTime: last.timestamp,
          unread: !last.isCustomer && !last.readAt,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
        };
        const idx = Array.isArray(list) ? list.findIndex((c: any) => c.providerId === providerId) : -1;
        const next = Array.isArray(list) ? [...list] : [];
        if (idx >= 0) next[idx] = entry; else next.push(entry);
        localStorage.setItem(listKey, JSON.stringify(next));
      } catch { /* noop */ }
    }
  }, [messages, convKey, listKey, conversationId, providerId, providerName, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (
    type: "text" | "image" | "voice" | "file" = "text",
    attachmentUrl?: string,
    attachmentName?: string,
  ) => {
    if (type === "text" && !newMessage.trim()) return;
    const content = type === "text" ? newMessage.trim() : attachmentName || "";
    const localId = `local_${Date.now()}`;
    const message: ChatMessage = {
      id: localId,
      senderId: "customer",
      senderName: "You",
      text: content,
      timestamp: new Date(),
      isCustomer: true,
      type,
      attachmentUrl,
      attachmentName,
      deliveredAt: null,
      readAt: null,
      status: "sending",
    };
    setMessages((prev) => [...prev, message]);
    if (type === "text") setNewMessage("");
    if (type !== "text") return;

    try {
      let serverMsg: any;
      if (conversationId) {
        serverMsg = await messagingService.sendMessage(conversationId, content);
      } else {
        try {
          const conv = await messagingService.startConversation(providerId, content);
          if (conv?.id) setConversationId(conv.id);
        } catch {
          const listed = await messagingService.listConversations();
          const match = (listed?.data ?? []).find((c) => c.providerId === providerId);
          if (match?.id) {
            setConversationId(match.id);
            serverMsg = await messagingService.sendMessage(match.id, content);
          } else {
            throw new Error("start_failed");
          }
        }
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === localId
            ? {
                ...m,
                status: "sent",
                serverId: serverMsg?.id ? Number(serverMsg.id) : m.serverId,
                id: serverMsg?.id ? `srv_${serverMsg.id}` : m.id,
                timestamp: serverMsg?.sentAt ? new Date(serverMsg.sentAt) : m.timestamp,
                deliveredAt: serverMsg?.deliveredAt ?? null,
                readAt: serverMsg?.readAt ?? null,
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, status: "failed" } : m)));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleSendMessage("image", url, file.name);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleSendMessage("file", url, file.name);
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSendMessage("voice", undefined, "Voice message (0:05)");
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        handleSendMessage("voice", undefined, "Voice message (0:05)");
      }, 5000);
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    switch (message.type) {
      case "image":
        return (
          <div>
            <img
              loading="lazy"
              decoding="async"
              src={message.attachmentUrl}
              alt="Shared image"
              className="max-w-[200px] rounded-lg mb-1"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
            />
            <p className="text-xs opacity-70">{message.attachmentName}</p>
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="text-sm">{message.text || "Voice message"}</span>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm underline">{message.attachmentName}</span>
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.text}</p>;
    }
  };

  // Issue #2 — three-state tick: sent → delivered → read.
  const renderStatusIcon = (message: ChatMessage) => {
    if (message.status === "sending") return <Clock className="h-3 w-3" />;
    if (message.status === "failed") return <AlertCircle className="h-3 w-3 text-destructive" />;
    if (message.readAt) return <CheckCheck className="h-3 w-3 text-primary" aria-label="Read" />;
    if (message.deliveredAt) return <CheckCheck className="h-3 w-3 text-muted-foreground" aria-label="Delivered" />;
    return <Check className="h-3 w-3" aria-label="Sent" />;
  };

  return (
    <div className={cn("flex flex-col bg-card border rounded-lg overflow-hidden", compact ? "h-[500px]" : "h-[calc(100vh-220px)] min-h-[400px]")}>
      <div className="px-6 py-4 border-b flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {providerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Chatting with</p>
          <h2 className="font-semibold leading-tight">{providerName}</h2>
          <p className="text-xs text-muted-foreground">Service Provider</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.isCustomer ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={message.isCustomer ? "bg-secondary" : "bg-primary text-primary-foreground"}>
                    {message.senderName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col gap-1 max-w-[70%] ${message.isCustomer ? "items-end" : ""}`}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2",
                      message.isCustomer ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {renderMessageContent(message)}
                  </div>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {message.isCustomer && (
                      <span className="text-xs text-muted-foreground">{renderStatusIcon(message)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t bg-background">
        <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
        <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileUpload} />
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => imageInputRef.current?.click()} aria-label="Attach image">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className="shrink-0"
            onClick={handleVoiceRecord}
            aria-label={isRecording ? "Stop recording" : "Record voice message"}
          >
            <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
          </Button>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            aria-label="Message text"
          />
          <Button onClick={() => handleSendMessage()} size="icon" className="shrink-0" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;