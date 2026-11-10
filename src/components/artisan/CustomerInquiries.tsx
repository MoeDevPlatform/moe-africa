import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { messagingService, type Conversation, type Message } from "@/lib/apiServices";
import VoiceMessagePlayer from "@/components/marketplace/VoiceMessagePlayer";

interface InquiryRow {
  conversation: Conversation;
  messages: Message[];
}

const CustomerInquiries = () => {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({});
  const [savedNotes, setSavedNotes] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await messagingService.listConversations();
      const convs = res.data ?? [];
      const rows = await Promise.all(
        convs.map(async (c) => {
          const msgs = await messagingService.getMessages(c.id);
          return { conversation: c, messages: msgs.data ?? [] };
        }),
      );
      setInquiries(rows);
      const initialSaved: Record<number, string> = {};
      for (const row of rows) {
        const note = (row.conversation as Conversation & { artisanNote?: string }).artisanNote;
        if (note) initialSaved[row.conversation.id] = note;
      }
      setSavedNotes((prev) => ({ ...initialSaved, ...prev }));
    } catch {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    <div className="space-y-4">
      {inquiries.map(({ conversation, messages }) => {
        const customerMsgs = messages.filter(
          (m) => m.senderRole === "customer" || m.senderType === "customer",
        );
        const adminMsgs = messages.filter(
          (m) => m.senderRole === "admin" || m.senderType === "provider",
        );
        const conv = conversation as Conversation & { status?: string; artisanNote?: string };
        const savedNote = savedNotes[conversation.id] ?? conv.artisanNote ?? "";
        const draft = draftNotes[conversation.id] ?? "";
        const isSaving = savingId === conversation.id;

        return (
          <Card key={conversation.id} className="p-4 space-y-3" data-testid="artisan-inquiry-card">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{conversation.customerName ?? "Customer"}</h3>
              {statusBadge(conv.status)}
            </div>

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
              <p className="text-sm text-muted-foreground italic">Awaiting MoE Support response</p>
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
              <label className="text-sm font-medium" htmlFor={`private-note-${conversation.id}`}>
                Add a private note for our support team
              </label>
              <Textarea
                id={`private-note-${conversation.id}`}
                data-testid="private-note-input"
                value={draft}
                onChange={(e) =>
                  setDraftNotes((prev) => ({ ...prev, [conversation.id]: e.target.value }))
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
          </Card>
        );
      })}
    </div>
  );
};

export default CustomerInquiries;
