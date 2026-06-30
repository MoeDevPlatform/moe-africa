import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import {
  adminMessagingService,
  type AdminConversation,
  type Message,
} from "@/lib/apiServices";

const STATUS_LABELS: Record<string, string> = {
  unread: "Unread",
  replied: "Replied",
  resolved: "Resolved",
  needs_follow_up: "Needs Follow-Up",
};

const AdminMessages = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thread, setThread] = useState<{
    conversation: AdminConversation;
    messages: Message[];
  } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const loadList = () => {
    setIsLoading(true);
    adminMessagingService
      .listConversations({ pageSize: 50 })
      .then((res) => setConversations(res.data ?? []))
      .catch((e: Error) => toast.error(e.message || "Failed to load conversations"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setThread(null);
      return;
    }
    adminMessagingService
      .getConversation(Number(conversationId))
      .then(setThread)
      .catch((e: Error) => toast.error(e.message || "Failed to load thread"));
  }, [conversationId]);

  const handleSendReply = async () => {
    if (!conversationId || !reply.trim()) return;
    setSending(true);
    try {
      await adminMessagingService.reply(Number(conversationId), reply.trim());
      setReply("");
      const updated = await adminMessagingService.getConversation(Number(conversationId));
      setThread(updated);
      loadList();
      toast.success("Reply sent");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!conversationId) return;
    try {
      await adminMessagingService.updateStatus(Number(conversationId), status);
      const updated = await adminMessagingService.getConversation(Number(conversationId));
      setThread(updated);
      loadList();
      toast.success("Status updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  if (conversationId) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-3xl">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/messages")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to inbox
          </Button>

          {thread ? (
            <>
              <div>
                <h1 className="text-2xl font-display font-bold">
                  {thread.conversation.customerName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Re: {thread.conversation.artisanName ?? thread.conversation.providerName}
                </p>
              </div>

              {thread.conversation.artisanNote && (
                <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Artisan&apos;s private note (not visible to customer):
                  </p>
                  <p className="text-sm mt-1">{thread.conversation.artisanNote}</p>
                </Card>
              )}

              <Card className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`text-sm p-3 rounded-lg ${
                      m.senderRole === "admin" || m.senderType === "provider"
                        ? "bg-primary/10 ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    <p className="font-medium text-xs text-muted-foreground mb-1">
                      {m.senderRole === "admin" || m.senderType === "provider"
                        ? "MoE Support"
                        : thread.conversation.customerName}
                    </p>
                    <p>{m.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(m.sentAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reply as MoE Support</label>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply to the customer..."
                  rows={4}
                />
                <div className="flex flex-wrap gap-3 items-center">
                  <Button onClick={handleSendReply} disabled={sending || !reply.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                  <Select
                    value={thread.conversation.status ?? "unread"}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([v, label]) => (
                        <SelectItem key={v} value={v}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Customer Messages</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer inquiries on behalf of artisans
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : conversations.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No conversations yet</Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Card
                key={c.id}
                className="p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/admin/messages/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{c.customerName}</h3>
                      <Badge variant="outline" className="text-xs">
                        Re: {c.artisanName ?? c.providerName}
                      </Badge>
                      {c.unreadCount > 0 && <Badge>New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {c.lastMessage}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary">
                      {STATUS_LABELS[c.status ?? "unread"] ?? c.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(c.lastMessageAt ?? c.lastMessageTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
