import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Mic, Paperclip, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { messagingService } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isCustomer: boolean;
  type: "text" | "image" | "voice" | "file";
  attachmentUrl?: string;
  attachmentName?: string;
  /** Server-confirmed read timestamp. Null/undefined means not yet read. */
  readAt?: string | null;
  /** Server-confirmed delivered timestamp. */
  deliveredAt?: string | null;
  /** Local-only send status for optimistic UI. */
  status?: "sending" | "sent" | "failed";
  /** Server message id (number) once confirmed; used to dedupe with poll. */
  serverId?: number;
}

interface MessagingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  providerName: string;
}

const MessagingModal = ({
  open,
  onOpenChange,
  providerId,
  providerName,
}: MessagingModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  // Ref mirrors state so back-to-back sends don't race React's render cycle.
  const conversationIdRef = useRef<number | null>(null);
  const adoptConversationId = (id: number | null) => {
    conversationIdRef.current = id;
    setConversationId(id);
  };
  // Guard against concurrent startConversation calls (rapid double-send).
  const startInFlightRef = useRef<Promise<number | null> | null>(null);
  const { user } = useAuth();
  const userScope = user?.id != null ? String(user.id) : "guest";
  const convKey = `conversation_${userScope}_${providerId}`;
  const listKey = `conversations_${userScope}`;

  useEffect(() => {
    // Load conversation from localStorage (scoped per user to avoid cross-user leakage)
    const saved = localStorage.getItem(convKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ 
        ...m, 
        timestamp: new Date(m.timestamp),
        type: m.type || "text",
        readAt: m.readAt ?? null,
        status: m.status ?? "sent",
      })));
    } else {
      setMessages([]);
    }
  }, [convKey]);

  // Resolve a server-side conversationId for this provider if available.
  // Best-effort — failures keep the localStorage simulation working.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    messagingService
      .listConversations()
      .then((res) => {
        if (cancelled) return;
        const items = res?.data ?? [];
        const match = items.find((c) => c.providerId === providerId);
        if (match?.id) adoptConversationId(match.id);
      })
      .catch(() => { /* backend not ready — silent */ });
    return () => { cancelled = true; };
  }, [open, providerId]);

  // Issue #2 — mark conversation read on open so the sender sees their
  // outbound messages flip to "read" on the next poll cycle.
  useEffect(() => {
    if (!open || !conversationId) return;
    messagingService.markRead(conversationId).catch(() => { /* silent */ });
  }, [open, conversationId]);

  // Poll the conversation for new messages while the modal is open.
  // Cleanup runs on unmount, modal close, or conversation change so we never
  // leave a stray interval running (Task 6 — explicit cleanup requirement).
  useEffect(() => {
    if (!open || !conversationId) return;
    let cancelled = false;

    const fetchOnce = () => {
      messagingService
        .getMessages(conversationId)
        .then((res) => {
          if (cancelled) return;
          const serverMessages = res?.data ?? [];
          if (!Array.isArray(serverMessages)) return;
          setMessages((prev) => {
            // Index existing rows by serverId so we can refresh `readAt`.
            const byServerId = new Map<number, number>();
            prev.forEach((m, i) => {
              if (m.serverId != null) byServerId.set(m.serverId, i);
            });
            const next = [...prev];
            let changed = false;
            for (const m of serverMessages as any[]) {
              const sid = Number(m.id);
              const mapped: Message = {
                id: `srv_${sid}`,
                serverId: sid,
                senderId: m.senderId != null ? String(m.senderId) : String(providerId),
                senderName: m.senderName ?? (m.senderType === "customer" ? "You" : providerName),
                text: m.content ?? m.text ?? "",
                timestamp: m.sentAt ? new Date(m.sentAt) : m.createdAt ? new Date(m.createdAt) : new Date(),
                isCustomer: m.senderType === "customer",
                type: "text",
                readAt: m.readAt ?? null,
                status: "sent",
              };
              if (byServerId.has(sid)) {
                const idx = byServerId.get(sid)!;
                const existing = next[idx];
                if (existing.readAt !== mapped.readAt) {
                  next[idx] = { ...existing, readAt: mapped.readAt };
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
        .catch(() => { /* silent — keep last good state */ });
    };

    fetchOnce();
    const intervalId = window.setInterval(fetchOnce, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [open, conversationId, providerId, providerName]);

  useEffect(() => {
    // Save conversation to localStorage (user-scoped key)
    if (messages.length > 0) {
      localStorage.setItem(convKey, JSON.stringify(messages));
      
      // Also save to conversations list
      const conversations = JSON.parse(localStorage.getItem(listKey) || "[]");
      const existingIndex = conversations.findIndex((c: any) => c.providerId === providerId);
      const lastMessage = messages[messages.length - 1];
      
      const conversationData = {
        id: conversationId ?? undefined,
        providerId,
        providerName,
        lastMessage: lastMessage.text,
        lastMessageTime: lastMessage.timestamp,
        unread: !lastMessage.isCustomer && !lastMessage.readAt,
        // Issue #1 — tag local stub with creator + timestamp so Messages.tsx
        // can keep it visible to the sender until the server returns it.
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        conversations[existingIndex] = conversationData;
      } else {
        conversations.push(conversationData);
      }
      
      localStorage.setItem(listKey, JSON.stringify(conversations));
    }
  }, [messages, providerId, providerName, convKey, listKey]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (type: "text" | "image" | "voice" | "file" = "text", attachmentUrl?: string, attachmentName?: string) => {
    if (type === "text" && !newMessage.trim()) return;

    const content = type === "text" ? newMessage.trim() : (attachmentName || "");
    const localId = `local_${Date.now()}`;
    const message: Message = {
      id: localId,
      senderId: "customer",
      senderName: "You",
      text: content,
      timestamp: new Date(),
      isCustomer: true,
      type,
      attachmentUrl,
      attachmentName,
      readAt: null,
      status: "sending",
    };

    setMessages((prev) => [...prev, message]);
    if (type === "text") setNewMessage("");

    // Only persist text messages to the backend for now — attachments are
    // still local-only until upload endpoints exist.
    if (type !== "text") return;

    try {
      let serverMsg;
      const existingConvId = conversationIdRef.current ?? conversationId;
      if (existingConvId) {
        serverMsg = await messagingService.sendMessage(existingConvId, content);
      } else {
        // Dedupe rapid double-sends: only one startConversation in flight.
        if (!startInFlightRef.current) {
          startInFlightRef.current = (async () => {
            try {
              const conv: any = await messagingService.startConversation(providerId, content);
              // Backend may return `id`, `conversationId`, or nested under `data`.
              const cid =
                Number(conv?.id ?? conv?.conversationId ?? conv?.data?.id ?? conv?.data?.conversationId) || null;
              if (cid) return cid;
              throw new Error("missing_conversation_id");
            } catch (err) {
              // 409/400/missing-id → look up existing conversation.
              const listed = await messagingService.listConversations();
              const match = (listed?.data ?? []).find((c: any) => {
                const pid = c.providerId ?? c.provider?.id;
                return Number(pid) === Number(providerId);
              });
              if (match?.id) return Number(match.id);
              throw err instanceof Error ? err : new Error("start_and_recover_failed");
            }
          })().finally(() => {
            // Release the in-flight slot once resolved/rejected.
            // eslint-disable-next-line no-multi-assign
            startInFlightRef.current = null;
          });
        }
        const adoptedId = await startInFlightRef.current;
        if (!adoptedId) throw new Error("no_conversation_id");
        adoptConversationId(adoptedId);
        // If startConversation succeeded but didn't return the message body,
        // fetch it so the optimistic row can adopt the real id/sentAt/readAt.
        try {
          const res = await messagingService.getMessages(adoptedId);
          const last = (res?.data ?? []).find(
            (m: any) => (m.content ?? m.text) === content && m.senderType === "customer",
          );
          if (last) {
            serverMsg = last as any;
          } else {
            // No matching message means startConversation didn't create one
            // (or matched an existing conversation). Send explicitly.
            serverMsg = await messagingService.sendMessage(adoptedId, content);
          }
        } catch {
          serverMsg = await messagingService.sendMessage(adoptedId, content);
        }
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === localId
            ? {
                ...m,
                status: "sent",
                serverId: serverMsg && (serverMsg as any).id ? Number((serverMsg as any).id) : m.serverId,
                id: serverMsg && (serverMsg as any).id ? `srv_${(serverMsg as any).id}` : m.id,
                timestamp: serverMsg && (serverMsg as any).sentAt
                  ? new Date((serverMsg as any).sentAt)
                  : m.timestamp,
                readAt: (serverMsg as any)?.readAt ?? null,
              }
            : m,
        ),
      );
    } catch (err) {
      console.error("[MessagingModal] send failed", err);
      const message =
        (err as any)?.message && typeof (err as any).message === "string"
          ? (err as any).message
          : "Could not send message";
      toast({ title: "Message not sent", description: message, variant: "destructive" });
      setMessages((prev) =>
        prev.map((m) => (m.id === localId ? { ...m, status: "failed" } : m)),
      );
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
      // Simulate voice note
      handleSendMessage("voice", undefined, "Voice message (0:05)");
    } else {
      setIsRecording(true);
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        setIsRecording(false);
        handleSendMessage("voice", undefined, "Voice message (0:05)");
      }, 5000);
    }
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case "image":
        return (
          <div>
            <img loading="lazy" decoding="async" 
              src={message.attachmentUrl} 
              alt="Shared image" 
              className="max-w-[200px] rounded-lg mb-1"
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
        return <p className="text-sm">{message.text}</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {providerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{providerName}</DialogTitle>
              <p className="text-sm text-muted-foreground">Service Provider</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isCustomer ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={message.isCustomer ? "bg-secondary" : "bg-primary"}>
                        {message.senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 max-w-[70%] ${message.isCustomer ? "items-end" : ""}`}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2",
                          message.isCustomer
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {renderMessageContent(message)}
                      </div>
                      <div className="flex items-center gap-1 px-2">
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.isCustomer && (
                          <span
                            className="text-xs text-muted-foreground"
                            aria-label={
                              message.status === "sending"
                                ? "Sending"
                                : message.status === "failed"
                                  ? "Failed to send"
                                  : message.readAt
                                    ? "Read"
                                    : "Sent"
                            }
                          >
                            {message.status === "sending" ? (
                              <Clock className="h-3 w-3" />
                            ) : message.status === "failed" ? (
                              <AlertCircle className="h-3 w-3 text-destructive" />
                            ) : message.readAt ? (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary">
                        {providerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-background">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button 
              variant={isRecording ? "destructive" : "outline"} 
              size="icon" 
              className="shrink-0"
              onClick={handleVoiceRecord}
            >
              <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={() => handleSendMessage()} size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;
