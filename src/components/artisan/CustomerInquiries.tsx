import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { messagingService, type Conversation, type Message } from "@/lib/apiServices";
import VoiceMessagePlayer from "@/components/marketplace/VoiceMessagePlayer";
import { cn } from "@/lib/utils";

interface InquiryRow {
  conversation: Conversation;
  messages: Message[];
}

function formatWhen(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const CustomerInquiries = () => {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({});
  const [savedNotes, setSavedNotes] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<Record<number, Message[]>>({});

  const load = async () => {
    setLoading(true);
    try {
      // Provider-side only — never personal buyer threads.
      const res = await messagingService.listConversations({ as: "provider" });
      const convs = res.data ?? [];
      setInquiries(
        convs.map((c) => ({
          conversation: c,
          messages: loadedMessages[c.id] ?? [],
        })),
      );
      const initialSaved: Record<number, string> = {};
      for (const c of convs) {
        const note = (c as Conversation & { artisanNote?: string }).artisanNote;
        if (note) initialSaved[c.id] = note;
      }
      setSavedNotes((prev) => ({ ...initialSaved, ...prev }));
    } catch {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Intentionally once on mount; expanded card keeps its own message load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureMessages = async (conversationId: number) => {
    if (loadedMessages[conversationId]) return;
    try {
      const msgs = await messagingService.getMessages(conversationId);
      const data = msgs.data ?? [];
      setLoadedMessages((prev) => ({ ...prev, [conversationId]: data }));
      setInquiries((prev) =>
        prev.map((row) =>
          row.conversation.id === conversationId ? { ...row, messages: data } : row,
        ),
      );
    } catch {
      toast.error("Failed to load conversation history");
    }
  };

  const handleToggle = (conversationId: number, open: boolean) => {
    if (open) {
      setExpandedId(conversationId);
      void ensureMessages(conversationId);
    } else if (expandedId === conversationId) {
      setExpandedId(null);
    }
  };

  const handleSendNote = async (conversationId: number) => {
    const note = (draftNotes[conversationId] ?? "").trim();
    if (!note || savingId === conversationId) return;

    setSavingId(conversationId);
    try {
      const res = await messagingService.updateArtisanNote(conversationId, note);
      const saved = res.artisanNote ?? note;
      setSavedNotes((prev) => ({ ...prev, [conversationId]: saved }));
      setDraftNotes((prev) => ({ ...prev, [conversationId]: "" }));
      toast.success("Your private note has been sent to the MOE Support Team.");
    } catch {
      toast.error("Failed to send private note. Your note was not cleared.");
    } finally {
      setSavingId(null);
    }
  };

  const statusBadge = (status?: string) => {
    const s = status ?? "unread";
    if (s === "replied" || s === "resolved") {
      return <Badge className="bg-green-600">Responded</Badge>;
    }
    return <Badge variant="secondary">Awaiting Response</Badge>;
  };

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (inquiries.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No customer inquiries yet. When customers contact MoE about your work, they&apos;ll appear here.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map(({ conversation, messages }) => {
        const conv = conversation as Conversation & { status?: string; artisanNote?: string };
        const savedNote = savedNotes[conversation.id] ?? conv.artisanNote ?? "";
        const draft = draftNotes[conversation.id] ?? "";
        const isSaving = savingId === conversation.id;
        const isOpen = expandedId === conversation.id;
        const history = loadedMessages[conversation.id] ?? messages;
        const customerMsgs = history.filter(
          (m) => m.senderRole === "customer" || m.senderType === "customer",
        );
        const adminMsgs = history.filter(
          (m) => m.senderRole === "admin" || m.senderType === "provider",
        );
        // No listingId on Conversation yet — use a stable inquiry label.
        const subject = "Customer inquiry";

        return (
          <Collapsible
            key={conversation.id}
            open={isOpen}
            onOpenChange={(open) => handleToggle(conversation.id, open)}
          >
            <Card className="overflow-hidden" data-testid="artisan-inquiry-card">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors"
                  data-testid="artisan-inquiry-toggle"
                  aria-expanded={isOpen}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 mt-1 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">
                        {conversation.customerName ?? "Customer"}
                      </h3>
                      {statusBadge(conv.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">Re: {subject}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatWhen(conversation.lastMessageAt ?? conversation.lastMessageTime)}
                  </span>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t px-4 pb-4 pt-3 space-y-3" data-testid="artisan-inquiry-body">
                  {customerMsgs.map((m) => (
                    <div key={m.id} className="bg-muted rounded-lg p-3 text-sm space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">Customer</p>
                      {m.content ? <p>{m.content}</p> : null}
                      {m.attachment?.kind === "voice" ? (
                        <VoiceMessagePlayer
                          attachmentPath={m.attachment.url}
                          durationMs={m.attachment.durationMs ?? m.durationMs}
                          compact
                        />
                      ) : null}
                    </div>
                  ))}

                  {adminMsgs.length > 0 ? (
                    adminMsgs.map((m) => (
                      <div key={m.id} className="bg-primary/10 rounded-lg p-3 text-sm space-y-2">
                        <p className="text-xs text-muted-foreground mb-1">MoE Support reply</p>
                        {m.content ? <p>{m.content}</p> : null}
                        {m.attachment?.kind === "voice" ? (
                          <VoiceMessagePlayer
                            attachmentPath={m.attachment.url}
                            durationMs={m.attachment.durationMs ?? m.durationMs}
                            compact
                          />
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Awaiting MoE Support response
                    </p>
                  )}

                  {savedNote ? (
                    <div
                      className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm"
                      data-testid="private-note-history"
                    >
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Private note
                      </p>
                      <p className="whitespace-pre-wrap">{savedNote}</p>
                    </div>
                  ) : null}

                  <div className="border-t pt-3 space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`private-note-${conversation.id}`}
                    >
                      Add a private note for our support team
                    </label>
                    <Textarea
                      id={`private-note-${conversation.id}`}
                      data-testid="private-note-input"
                      value={draft}
                      onChange={(e) =>
                        setDraftNotes((prev) => ({
                          ...prev,
                          [conversation.id]: e.target.value,
                        }))
                      }
                      placeholder="Context for our team (not sent to the customer)..."
                      rows={2}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your note is only visible to MoE Support — the customer will not see this.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="private-note-send"
                      onClick={() => void handleSendNote(conversation.id)}
                      disabled={isSaving || !draft.trim()}
                    >
                      {isSaving ? "Sending..." : "Send Note"}
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default CustomerInquiries;
