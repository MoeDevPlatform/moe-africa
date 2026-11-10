import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  X,
  Download,
  FileText,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MESSAGE_ATTACHMENT_ACCEPT_ATTR,
  messagingService,
  validateMessageAttachment,
  type MessageAttachment,
} from "@/lib/apiServices";
import { MoeApiError } from "@/lib/moeApi";
import { useAuth } from "@/contexts/AuthContext";
import { resolveMessageSenderName } from "@/lib/messagingDisplay";
import { toast } from "sonner";
import VoiceComposer from "@/components/marketplace/VoiceComposer";
import VoiceMessagePlayer from "@/components/marketplace/VoiceMessagePlayer";
import type { VoiceDraft } from "@/lib/voiceRecording";
import { formatRecordingTime } from "@/lib/voiceRecording";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isCustomer: boolean;
  type: "text" | "image" | "file" | "voice";
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentBytes?: number | null;
  durationMs?: number | null;
  clientKey?: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  status?: "sending" | "sent" | "failed";
  serverId?: number;
  uploadProgress?: number;
}

interface PendingAttachment {
  file: File;
  previewUrl?: string;
}

interface ChatThreadProps {
  providerId: number;
  providerName: string;
  /** Pre-resolved conversation id (preferred — skips lookup). */
  initialConversationId?: number;
  /** Compact layout for small containers (e.g. modal use). */
  compact?: boolean;
  /** Fill a parent panel: no duplicate header, text composer with a Send button. */
  embedded?: boolean;
  /** Controlled draft text (preserved across expand/minimize). */
  draft?: string;
  onDraftChange?: (value: string) => void;
  /** Controlled scroll offset (preserved across expand/minimize). */
  scrollTop?: number;
  onScrollTopChange?: (value: number) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AuthImage({ path, alt }: { path: string; alt: string }) {
  const [src, setSrc] = useState(
    path.startsWith("blob:") || path.startsWith("http") ? path : "/placeholder.svg",
  );

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    if (path.startsWith("blob:") || path.startsWith("http")) {
      setSrc(path);
      return;
    }
    void messagingService
      .fetchAttachmentBlobUrl(path)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc("/placeholder.svg");
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [path]);

  return (
    <img
      loading="lazy"
      decoding="async"
      src={src}
      alt={alt}
      className="max-w-[200px] rounded-lg mb-1"
    />
  );
}

function mapServerAttachment(
  attachment: MessageAttachment | null | undefined,
): Pick<
  ChatMessage,
  | "type"
  | "attachmentUrl"
  | "attachmentName"
  | "attachmentMimeType"
  | "attachmentBytes"
  | "durationMs"
> {
  if (!attachment) {
    return { type: "text" };
  }
  const type: ChatMessage["type"] =
    attachment.kind === "image" ? "image" : attachment.kind === "voice" ? "voice" : "file";
  return {
    type,
    attachmentUrl: attachment.url,
    attachmentName: attachment.name,
    attachmentMimeType: attachment.mimeType,
    attachmentBytes: attachment.bytes,
    durationMs: attachment.durationMs ?? null,
  };
}

function lastMessagePreview(message: ChatMessage): string {
  if (message.type === "voice") {
    return `🎤 Voice message (${formatRecordingTime(message.durationMs || 0)})`;
  }
  if (message.text) return message.text;
  if (message.type === "image") return "📷 Image";
  if (message.type === "file") return "📎 File";
  return "";
}

function newClientKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Collapse rows that share the same server-assigned id (keeps the last). */
function dedupeByServerId(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Map<number, number>();
  messages.forEach((m, i) => {
    if (m.serverId != null) seen.set(m.serverId, i);
  });
  if (seen.size === 0) return messages;
  return messages.filter((m, i) => m.serverId == null || seen.get(m.serverId) === i);
}

/**
 * Match an in-flight optimistic bubble to a server message.
 * Image/file optimistic text is often the filename while the API stores "📷 Image" /
 * "📎 name", so text equality alone is not enough.
 */
function matchesOptimisticLocal(
  existing: ChatMessage,
  mapped: ChatMessage,
): boolean {
  if (existing.serverId != null || existing.isCustomer !== mapped.isCustomer) {
    return false;
  }
  if (existing.clientKey && mapped.clientKey && existing.clientKey === mapped.clientKey) {
    return true;
  }
  if (existing.text && mapped.text && existing.text === mapped.text) {
    return true;
  }
  if (
    existing.type !== "text" &&
    existing.type === mapped.type &&
    (existing.status === "sending" || existing.status === "failed")
  ) {
    if (
      existing.attachmentName &&
      mapped.attachmentName &&
      existing.attachmentName === mapped.attachmentName
    ) {
      return true;
    }
    // Caption-less image/file/voice: single in-flight bubble of that type.
    if (!existing.text || existing.text === existing.attachmentName) {
      return true;
    }
  }
  return false;
}

/**
 * Chat surface used by the floating dock and /marketplace/messages/:conversationId.
 */
const ChatThread = ({
  providerId,
  providerName,
  initialConversationId,
  compact,
  embedded,
  draft,
  onDraftChange,
  scrollTop,
  onScrollTopChange,
}: ChatThreadProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [internalDraft, setInternalDraft] = useState("");
  const newMessage = draft !== undefined ? draft : internalDraft;
  const setNewMessage = (value: string) => {
    if (onDraftChange) onDraftChange(value);
    else setInternalDraft(value);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreScrollRef = useRef(true);
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId ?? null);
  const [historyStatus, setHistoryStatus] = useState<"idle" | "ready" | "error">("idle");
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [voicePhase, setVoicePhase] = useState<"idle" | "recording" | "preview" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const voiceDraftsRef = useRef<Map<string, VoiceDraft>>(new Map());
  /** Sync guard — React state alone cannot block a rapid second Send click. */
  const sendingLockRef = useRef(false);
  const { user } = useAuth();
  const voiceComposerActive =
    voicePhase === "recording" || voicePhase === "preview";
  const isSelfChat =
    user?.role === "artisan" && user?.artisanProfile?.id === providerId;

  if (isSelfChat) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-card text-center px-6", embedded ? "h-full min-h-0" : "border rounded-lg overflow-hidden", !embedded && (compact ? "h-[500px]" : "h-[calc(100vh-220px)] min-h-[400px]"))}>
        <Avatar className="h-16 w-16 mb-4">
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
            {providerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg mb-1">Your Storefront</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          You can&apos;t start a conversation with your own business. Customers will message you here.
        </p>
      </div>
    );
  }

  const userScope = user?.id != null ? String(user.id) : "guest";
  const convKey = `conversation_${userScope}_${providerId}`;
  const listKey = `conversations_${userScope}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(convKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(
          dedupeByServerId(
            parsed.map((m: ChatMessage & { timestamp: string }) => ({
              ...m,
              timestamp: new Date(m.timestamp),
              type: m.type || "text",
              readAt: m.readAt ?? null,
              deliveredAt: m.deliveredAt ?? null,
              status: m.status ?? "sent",
            })),
          ),
        );
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, [convKey]);

  useEffect(() => {
    if (initialConversationId) {
      setConversationId(initialConversationId);
      return;
    }
    let cancelled = false;
    messagingService
      .listConversations({ as: "customer" })
      .then((res) => {
        if (cancelled) return;
        const match = (res?.data ?? []).find((c) => c.providerId === providerId);
        if (match?.id) setConversationId(match.id);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [providerId, initialConversationId]);

  useEffect(() => {
    if (!conversationId) return;
    messagingService.markRead(conversationId).catch(() => { /* silent */ });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setHistoryStatus("idle");
      return;
    }
    let cancelled = false;
    setHistoryStatus("idle");

    const fetchOnce = () => {
      messagingService
        .getMessages(conversationId)
        .then((res) => {
          if (cancelled) return;
          const serverMessages = res?.data ?? [];
          if (!Array.isArray(serverMessages)) {
            setHistoryStatus("ready");
            return;
          }
          setMessages((prev) => {
            const byServerId = new Map<number, number>();
            prev.forEach((m, i) => {
              if (m.serverId != null) byServerId.set(m.serverId, i);
            });
            const next = [...prev];
            let changed = false;
            for (const m of serverMessages) {
              const sid = Number(m.id);
              const mappedAttachment = mapServerAttachment(m.attachment);
              const mapped: ChatMessage = {
                id: `srv_${sid}`,
                serverId: sid,
                senderId: m.senderId != null ? String(m.senderId) : String(providerId),
                senderName: resolveMessageSenderName(m, providerName, true),
                text: m.content ?? "",
                timestamp: m.sentAt ? new Date(m.sentAt) : new Date(),
                isCustomer: m.senderType === "customer",
                ...mappedAttachment,
                durationMs: mappedAttachment.durationMs ?? m.durationMs ?? null,
                clientKey: m.clientKey ?? undefined,
                deliveredAt: null,
                readAt: m.readAt ?? null,
                status: "sent",
              };
              if (byServerId.has(sid)) {
                const idx = byServerId.get(sid)!;
                const existing = next[idx];
                if (
                  existing.readAt !== mapped.readAt ||
                  existing.attachmentUrl !== mapped.attachmentUrl ||
                  existing.text !== mapped.text ||
                  existing.type !== mapped.type ||
                  existing.durationMs !== mapped.durationMs
                ) {
                  next[idx] = { ...existing, ...mapped, id: existing.id };
                  changed = true;
                }
              } else {
                const localIdx = next.findIndex((existing) =>
                  matchesOptimisticLocal(existing, mapped),
                );
                if (localIdx >= 0) {
                  next[localIdx] = { ...next[localIdx], ...mapped };
                  byServerId.set(sid, localIdx);
                } else {
                  byServerId.set(sid, next.length);
                  next.push(mapped);
                }
                changed = true;
              }
            }
            const deduped = dedupeByServerId(next);
            if (deduped.length !== next.length) changed = true;
            return changed ? deduped : prev;
          });
          setHistoryStatus("ready");
        })
        .catch(() => {
          if (cancelled) return;
          setHistoryStatus((status) => (status === "ready" ? status : "error"));
        });
    };

    fetchOnce();
    const id = window.setInterval(fetchOnce, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [conversationId, providerId, providerName, historyAttempt]);

  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(convKey, JSON.stringify(messages)); } catch { /* noop */ }

      try {
        const list = JSON.parse(localStorage.getItem(listKey) || "[]");
        const last = messages[messages.length - 1];
        const entry = {
          id: conversationId ?? undefined,
          providerId,
          providerName,
          lastMessage: lastMessagePreview(last),
          lastMessageTime: last.timestamp,
          unread: !last.isCustomer && !last.readAt,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
        };
        const idx = Array.isArray(list) ? list.findIndex((c: { providerId: number }) => c.providerId === providerId) : -1;
        const next = Array.isArray(list) ? [...list] : [];
        if (idx >= 0) next[idx] = entry; else next.push(entry);
        localStorage.setItem(listKey, JSON.stringify(next));
      } catch { /* noop */ }
    }
  }, [messages, convKey, listKey, conversationId, providerId, providerName, user?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreScrollRef.current && typeof scrollTop === "number" && scrollTop > 0) {
      el.scrollTop = scrollTop;
      restoreScrollRef.current = false;
      return;
    }
    if (restoreScrollRef.current) {
      el.scrollTop = el.scrollHeight;
      restoreScrollRef.current = false;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, scrollTop]);

  const clearPending = () => {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const ensureConversation = async (initialContent: string): Promise<number> => {
    if (conversationId) return conversationId;
    try {
      const conv = await messagingService.startConversation(providerId, initialContent);
      if (conv?.id) {
        setConversationId(conv.id);
        return conv.id;
      }
    } catch {
      /* fall through to lookup */
    }
    const listed = await messagingService.listConversations({ as: "customer" });
    const match = (listed?.data ?? []).find((c) => c.providerId === providerId);
    if (match?.id) {
      setConversationId(match.id);
      return match.id;
    }
    throw new Error("start_failed");
  };

  const persistLocalFailure = (localId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, status: "failed" } : m)));
  };

  const persistLocalSuccess = (localId: string, serverMsg: { id?: number; sentAt?: string; readAt?: string | null; content?: string; attachment?: MessageAttachment | null; clientKey?: string | null }) => {
    const mappedAttachment = mapServerAttachment(serverMsg.attachment);
    const serverId = serverMsg?.id != null ? Number(serverMsg.id) : undefined;
    setMessages((prev) => {
      const updated = prev.map((m) =>
        m.id === localId
          ? {
              ...m,
              ...mappedAttachment,
              status: "sent" as const,
              serverId: serverId ?? m.serverId,
              id: serverId != null ? `srv_${serverId}` : m.id,
              text: serverMsg?.content ?? m.text,
              timestamp: serverMsg?.sentAt ? new Date(serverMsg.sentAt) : m.timestamp,
              readAt: serverMsg?.readAt ?? null,
              uploadProgress: undefined,
              clientKey: m.clientKey,
            }
          : m,
      );
      // Drop a poll-inserted twin that arrived before this reconciliation.
      return dedupeByServerId(updated);
    });
  };

  const handleSendMessage = async (retry?: ChatMessage) => {
    const content = (retry?.text ?? newMessage).trim();
    const file = retry ? undefined : pending?.file;
    if (!content && !file) return;
    if (sending || sendingLockRef.current || sendingVoice) return;
    sendingLockRef.current = true;

    const localId = retry?.id ?? `local_${Date.now()}`;
    const clientKey = retry?.clientKey ?? newClientKey();
    const type: ChatMessage["type"] = file
      ? file.type.startsWith("image/")
        ? "image"
        : "file"
      : retry?.type ?? "text";

    if (!retry) {
      const message: ChatMessage = {
        id: localId,
        senderId: "customer",
        senderName: "You",
        text: content || (file ? file.name : ""),
        timestamp: new Date(),
        isCustomer: true,
        type,
        attachmentUrl: pending?.previewUrl,
        attachmentName: file?.name,
        attachmentMimeType: file?.type,
        attachmentBytes: file?.size ?? null,
        clientKey,
        deliveredAt: null,
        readAt: null,
        status: "sending",
        uploadProgress: file ? 0 : undefined,
      };
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === localId ? { ...m, status: "sending", clientKey: m.clientKey ?? clientKey } : m,
        ),
      );
    }

    setSending(true);
    setUploadProgress(file ? 0 : null);

    try {
      let serverMsg: Awaited<ReturnType<typeof messagingService.sendMessage>>;
      if (file) {
        // Create an empty conversation first so the attachment is the real message (no duplicate text).
        const cid = conversationId ?? (await ensureConversation(""));
        serverMsg = await messagingService.sendMessageWithAttachment(cid, {
          content,
          file,
          clientKey,
          onProgress: (percent) => {
            setUploadProgress(percent);
            setMessages((prev) =>
              prev.map((m) => (m.id === localId ? { ...m, uploadProgress: percent } : m)),
            );
          },
        });
        toast.success("Attachment uploaded successfully");
        clearPending();
      } else {
        if (conversationId) {
          serverMsg = await messagingService.sendMessage(conversationId, content);
        } else {
          const conv = await messagingService.startConversation(providerId, content);
          if (conv?.id) {
            setConversationId(conv.id);
            // Initial message already persisted by startConversation.
            serverMsg = {
              id: undefined as unknown as number,
              conversationId: conv.id,
              senderId: Number(user?.id) || 0,
              senderType: "customer",
              content,
              sentAt: new Date().toISOString(),
            };
          } else {
            throw new Error("start_failed");
          }
        }
      }

      persistLocalSuccess(localId, serverMsg);
      // Avoid toast spam for ordinary chat sends — only surface failures / attachment success.
    } catch (err) {
      persistLocalFailure(localId);
      if (!retry) {
        // Restore draft on failure; keep pending attachment.
        if (!file) setNewMessage(content);
      }
      const message =
        err instanceof MoeApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Message failed to send";
      if (file) toast.error(message || "Attachment upload failed");
      else toast.error(message || "Message failed to send");
    } finally {
      sendingLockRef.current = false;
      setSending(false);
      setUploadProgress(null);
    }
  };

  const handleSendVoice = async (draft: VoiceDraft, retryLocalId?: string) => {
    if (sending || sendingVoice) {
      throw new Error("Send already in progress");
    }
    const localId = retryLocalId ?? `local_voice_${Date.now()}`;
    const previewLabel = `🎤 Voice message (${formatRecordingTime(draft.durationMs)})`;
    voiceDraftsRef.current.set(localId, draft);

    if (!retryLocalId) {
      setMessages((prev) => [
        ...prev,
        {
          id: localId,
          senderId: "customer",
          senderName: "You",
          text: previewLabel,
          timestamp: new Date(),
          isCustomer: true,
          type: "voice",
          attachmentUrl: draft.objectUrl,
          attachmentName: draft.file.name,
          attachmentMimeType: draft.mimeType,
          attachmentBytes: draft.file.size,
          durationMs: draft.durationMs,
          clientKey: draft.clientKey,
          deliveredAt: null,
          readAt: null,
          status: "sending",
          uploadProgress: 0,
        },
      ]);
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === localId ? { ...m, status: "sending", uploadProgress: 0 } : m,
        ),
      );
    }

    setSendingVoice(true);
    try {
      const cid = conversationId ?? (await ensureConversation(""));
      const serverMsg = await messagingService.sendVoiceMessage(cid, {
        file: draft.file,
        durationMs: draft.durationMs,
        clientKey: draft.clientKey,
        onProgress: (percent) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === localId ? { ...m, uploadProgress: percent } : m)),
          );
        },
      });
      persistLocalSuccess(localId, serverMsg);
      voiceDraftsRef.current.delete(localId);
      toast.success("Voice note saved");
    } catch (err) {
      persistLocalFailure(localId);
      const message =
        err instanceof MoeApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Voice note failed to send";
      toast.error(message || "Voice note failed to send");
      throw err;
    } finally {
      setSendingVoice(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateMessageAttachment(file);
    } catch (err) {
      const message = err instanceof MoeApiError ? err.message : "Unsupported file format";
      toast.error(message);
      e.target.value = "";
      return;
    }
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setPending({ file, previewUrl });
  };

  const openAttachment = async (message: ChatMessage) => {
    if (!message.attachmentUrl) return;
    try {
      if (message.attachmentUrl.startsWith("blob:")) {
        window.open(message.attachmentUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const blobUrl = await messagingService.fetchAttachmentBlobUrl(message.attachmentUrl);
      if (message.type === "image") {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = message.attachmentName || "attachment";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      toast.error("Could not open attachment");
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.type === "image") {
      return (
        <div className="space-y-1">
          {message.attachmentUrl ? (
            <button type="button" className="block text-left" onClick={() => void openAttachment(message)}>
              <AuthImage
                path={message.attachmentUrl}
                alt={message.attachmentName || "Shared image"}
              />
            </button>
          ) : null}
          <p className="text-xs opacity-70">{message.attachmentName}</p>
          {message.text && message.text !== message.attachmentName ? (
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          ) : null}
          {message.status === "sending" && message.uploadProgress != null ? (
            <p className="text-xs opacity-70">Uploading {message.uploadProgress}%</p>
          ) : null}
        </div>
      );
    }
    if (message.type === "voice") {
      return (
        <div className="space-y-1">
          <VoiceMessagePlayer
            src={message.attachmentUrl?.startsWith("blob:") ? message.attachmentUrl : undefined}
            attachmentPath={
              message.attachmentUrl && !message.attachmentUrl.startsWith("blob:")
                ? message.attachmentUrl
                : undefined
            }
            durationMs={message.durationMs}
            compact={embedded || compact}
          />
          {message.status === "sending" && message.uploadProgress != null ? (
            <p className="text-xs opacity-70">Uploading {message.uploadProgress}%</p>
          ) : null}
        </div>
      );
    }
    if (message.type === "file") {
      return (
        <div className="space-y-1">
          <button
            type="button"
            className="flex items-center gap-2 underline text-left"
            onClick={() => void openAttachment(message)}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="text-sm">{message.attachmentName || "Attachment"}</span>
            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
          {message.attachmentBytes != null ? (
            <p className="text-xs opacity-70">{formatBytes(message.attachmentBytes)}</p>
          ) : null}
          {message.text && message.text !== message.attachmentName ? (
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          ) : null}
          {message.status === "sending" && message.uploadProgress != null ? (
            <p className="text-xs opacity-70">Uploading {message.uploadProgress}%</p>
          ) : null}
        </div>
      );
    }
    return <p className="text-sm whitespace-pre-wrap">{message.text}</p>;
  };

  const renderStatusIcon = (message: ChatMessage) => {
    if (message.status === "sending") return <Clock className="h-3 w-3" />;
    if (message.status === "failed") return <AlertCircle className="h-3 w-3 text-destructive" />;
    if (message.readAt) return <CheckCheck className="h-3 w-3 text-primary" aria-label="Read" />;
    if (message.deliveredAt) return <CheckCheck className="h-3 w-3 text-muted-foreground" aria-label="Delivered" />;
    return <Check className="h-3 w-3" aria-label="Sent" />;
  };

  const showHistoryLoading =
    !!conversationId && messages.length === 0 && historyStatus === "idle";
  const showHistoryError = historyStatus === "error" && messages.length === 0;
  const canSend = Boolean(newMessage.trim() || pending) && !sending;

  const messageList = (
    <div className="space-y-4 py-4">
      {showHistoryLoading ? (
        <p className="text-center py-12 text-sm text-muted-foreground" data-testid="messages-thread-loading">
          Loading messages…
        </p>
      ) : showHistoryError ? (
        <div className="text-center py-12 space-y-3" data-testid="messages-thread-error">
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this conversation.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setHistoryStatus("idle");
              setHistoryAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground" data-testid="messages-thread-empty">
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
                {message.isCustomer && message.status === "failed" ? (
                  <button
                    type="button"
                    className="text-xs text-destructive underline ml-1"
                    data-testid="messages-panel-retry"
                    onClick={() => {
                      if (message.type === "voice") {
                        const draft = voiceDraftsRef.current.get(message.id);
                        if (draft) void handleSendVoice(draft, message.id);
                        else toast.error("Recording is no longer available — record again");
                        return;
                      }
                      if (message.type === "text") {
                        void handleSendMessage(message);
                        return;
                      }
                      setMessages((prev) => prev.filter((m) => m.id !== message.id));
                      void handleSendMessage();
                    }}
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const pendingBar = pending ? (
    <div
      className="px-3 py-2 border-t bg-muted/40 flex items-center gap-3"
      data-testid="messages-panel-pending-attachment"
    >
      {pending.previewUrl ? (
        <img src={pending.previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
      ) : (
        <Paperclip className="h-4 w-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{pending.file.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(pending.file.size)}</p>
        {uploadProgress != null ? (
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Remove attachment"
        data-testid="messages-panel-remove-attachment"
        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
        onClick={clearPending}
        disabled={sending}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  const composer = (
    <div className={cn("border-t bg-background", embedded ? "px-3 py-3" : "px-6 py-4")}>
      <input
        type="file"
        ref={fileInputRef}
        accept={MESSAGE_ATTACHMENT_ACCEPT_ATTR}
        className="hidden"
        data-testid="messages-panel-file-input"
        onChange={handleFilePick}
      />
      <div className={cn("flex gap-2 items-center", voiceComposerActive && "flex-col items-stretch")}>
        {!voiceComposerActive ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            data-testid="messages-panel-attach"
            disabled={sending || sendingVoice}
          >
            {pending?.file.type.startsWith("image/") ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
        ) : null}
        <VoiceComposer
          compact={embedded || compact}
          disabled={sending || !!pending}
          sending={sendingVoice}
          onSend={handleSendVoice}
          onPhaseChange={setVoicePhase}
          className={
            voiceComposerActive || voicePhase === "error" ? "w-full min-w-0" : "shrink-0"
          }
        />
        {!voiceComposerActive ? (
          <>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              aria-label="Message text"
              data-testid="messages-panel-input"
              disabled={sending || sendingVoice}
            />
            {embedded ? (
              <Button
                type="button"
                onClick={() => void handleSendMessage()}
                className="shrink-0"
                disabled={!canSend || sendingVoice}
                data-testid="messages-panel-send"
              >
                Send
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleSendMessage()}
                size="icon"
                className="shrink-0"
                aria-label="Send message"
                disabled={!canSend || sendingVoice}
                data-testid="messages-panel-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col min-h-0 overflow-hidden",
        embedded
          ? "h-full bg-background"
          : cn("bg-card border rounded-lg", compact ? "h-[500px]" : "h-[calc(100vh-220px)] min-h-[400px]"),
      )}
      data-testid={embedded ? "messages-thread" : undefined}
    >
      {!embedded && (
        <div className="px-6 py-4 border-b flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {providerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Chatting with</p>
            <h2 className="font-semibold leading-tight">Re: {providerName}</h2>
            <p className="text-xs text-muted-foreground">Replies from MoE Support</p>
            <p className="text-xs text-muted-foreground">Service Provider</p>
          </div>
        </div>
      )}

      {embedded ? (
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4"
          onScroll={(e) => onScrollTopChange?.(e.currentTarget.scrollTop)}
        >
          {messageList}
        </div>
      ) : (
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          {messageList}
        </ScrollArea>
      )}

      {pendingBar}
      {composer}
    </div>
  );
};

export default ChatThread;
