import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { messagingService, type Conversation, type Message } from "@/lib/apiServices";

interface InquiryRow {
  conversation: Conversation;
  messages: Message[];
}

const CustomerInquiries = () => {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<number, string>>({});
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
      const initialNotes: Record<number, string> = {};
      for (const row of rows) {
        if ((row.conversation as Conversation & { artisanNote?: string }).artisanNote) {
          initialNotes[row.conversation.id] = (
            row.conversation as Conversation & { artisanNote?: string }
          ).artisanNote!;
        }
      }
      setNotes((prev) => ({ ...initialNotes, ...prev }));
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
    setSavingId(conversationId);
    try {
      await messagingService.updateArtisanNote(conversationId, notes[conversationId] ?? "");
      toast.success("Note saved — only MoE Support can see this");
    } catch {
      toast.error("Failed to save note");
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

        return (
          <Card key={conversation.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{conversation.customerName ?? "Customer"}</h3>
              {statusBadge(conv.status)}
            </div>

            {customerMsgs.map((m) => (
              <div key={m.id} className="bg-muted rounded-lg p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Customer</p>
                <p>{m.content}</p>
              </div>
            ))}

            {adminMsgs.length > 0 ? (
              adminMsgs.map((m) => (
                <div key={m.id} className="bg-primary/10 rounded-lg p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">MoE Support reply</p>
                  <p>{m.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">Awaiting MoE Support response</p>
            )}

            <div className="border-t pt-3 space-y-2">
              <label className="text-sm font-medium">Add a private note for our support team</label>
              <Textarea
                value={notes[conversation.id] ?? conv.artisanNote ?? ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [conversation.id]: e.target.value }))
                }
                placeholder="Context for our team (not sent to the customer)..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Your note is only visible to MoE Support — the customer will not see this.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSendNote(conversation.id)}
                disabled={savingId === conversation.id}
              >
                {savingId === conversation.id ? "Saving..." : "Send Note"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default CustomerInquiries;
