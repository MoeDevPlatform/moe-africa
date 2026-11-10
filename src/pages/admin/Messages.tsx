import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, MoreHorizontal, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  adminMessagingService,
  adminService,
  messagingService,
  type AdminConversation,
  type Message,
  type SupportTicket,
} from "@/lib/apiServices";
import VoiceComposer from "@/components/marketplace/VoiceComposer";
import VoiceMessagePlayer from "@/components/marketplace/VoiceMessagePlayer";
import type { VoiceDraft } from "@/lib/voiceRecording";

type InboxRow = AdminConversation & { ticketId?: number };

const ticketToRow = (t: SupportTicket): InboxRow => ({
  id: -t.id,
  ticketId: t.id,
  customerId: t.customerId ?? 0,
  providerId: 0,
  providerName: "MoE Support",
  customerName: t.email.split("@")[0] || "Contact",
  artisanName: "Contact Us",
  lastMessage: t.description,
  lastMessageTime: t.createdAt,
  lastMessageAt: t.createdAt,
  status: t.status,
  unreadCount: t.status === "open" ? 1 : 0,
  artisanId: 0,
  source: "contact_us",
  contactEmail: t.email,
});

const STATUS_LABELS: Record<string, string> = {
  unread: "Unread",
  replied: "Replied",
  resolved: "Resolved",
  needs_follow_up: "Needs Follow-Up",
};

const PAGE_SIZE = 10;
type CategoryKey = "all" | "contact_us" | "artisan" | "new" | "resolved";
const CATEGORY_TABS: { key: CategoryKey; label: string; match: (c: InboxRow) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "contact_us", label: "Contact Us", match: (c) => c.source === "contact_us" },
  { key: "artisan", label: "Artisan conversations", match: (c) => c.source !== "contact_us" },
  { key: "new", label: "New", match: (c) => c.unreadCount > 0 },
  { key: "resolved", label: "Resolved", match: (c) => c.status === "resolved" || c.status === "closed" },
];

const AdminMessages = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState<InboxRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thread, setThread] = useState<{
    conversation: AdminConversation;
    messages: Message[];
  } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminConversation | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [category, setCategory] = useState<CategoryKey>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const activeTab = CATEGORY_TABS.find((t) => t.key === category) ?? CATEGORY_TABS[0];
  const filtered = useMemo(
    () => conversations.filter(activeTab.match),
    [conversations, activeTab],
  );
  const visibleRows = filtered.slice(0, visibleCount);
  const visibleSelectableIds = visibleRows
    .filter((c) => c.source !== "contact_us" && c.id > 0)
    .map((c) => c.id);
  const allVisibleSelected =
    visibleSelectableIds.length > 0 &&
    visibleSelectableIds.every((id) => selectedIds.has(id));

  const loadList = (q?: string) => {
    setIsLoading(true);
    const query = (q ?? searchQuery).trim();
    Promise.all([
      adminMessagingService.listConversations({
        pageSize: 100,
        ...(query ? { q: query } : {}),
      }),
      adminService.listContactMessages(),
    ])
      .then(([convRes, tickets]) => {
        const convRows: InboxRow[] = (convRes.data ?? []).map((c) => ({
          ...c,
          source: c.source ?? "conversation",
        }));
        const contactRows = tickets
          .map(ticketToRow)
          .filter((row) => {
            if (!query) return true;
            const hay = [
              row.customerName,
              row.contactEmail,
              row.lastMessage,
              String(row.ticketId ?? ""),
            ]
              .join(" ")
              .toLowerCase();
            return hay.includes(query.toLowerCase());
          });
        const merged = [...contactRows, ...convRows].sort((a, b) => {
          const ta = new Date(a.lastMessageAt ?? a.lastMessageTime).getTime();
          const tb = new Date(b.lastMessageAt ?? b.lastMessageTime).getTime();
          return tb - ta;
        });
        setConversations(merged);
        setSelectedIds(new Set());
      })
      .catch((e: Error) => toast.error(e.message || "Failed to load conversations"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Clear selection when tab changes so hidden rows are never bulk-acted.
    setSelectedIds(new Set());
    setVisibleCount(PAGE_SIZE);
  }, [category]);

  useEffect(() => {
    if (!conversationId) {
      setThread(null);
      return;
    }
    const numericId = Number(conversationId);
    if (numericId < 0) {
      const row = conversations.find((c) => c.id === numericId);
      if (row) {
        setThread({
          conversation: row,
          messages: [
            {
              id: row.ticketId ?? 0,
              conversationId: row.id,
              senderId: 0,
              senderType: "customer",
              senderRole: "customer",
              content: row.lastMessage,
              sentAt: row.lastMessageAt ?? row.lastMessageTime,
            },
          ],
        });
      }
      return;
    }
    adminMessagingService
      .getConversation(numericId)
      .then(setThread)
      .catch((e: Error) => toast.error(e.message || "Failed to load thread"));
  }, [conversationId, conversations]);

  const handleSendReply = async () => {
    if (!conversationId || !reply.trim() || sendingVoice) return;
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

  const handleSendVoice = async (draft: VoiceDraft) => {
    if (!conversationId || sending || sendingVoice) {
      throw new Error("Send already in progress");
    }
    setSendingVoice(true);
    try {
      await adminMessagingService.replyWithVoice(Number(conversationId), {
        file: draft.file,
        durationMs: draft.durationMs,
        clientKey: draft.clientKey,
      });
      const updated = await adminMessagingService.getConversation(Number(conversationId));
      setThread(updated);
      loadList();
      toast.success("Voice note saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Voice note failed to send");
      throw e;
    } finally {
      setSendingVoice(false);
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

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleSelectableIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = searchInput.trim();
    setSearchQuery(next);
    setVisibleCount(PAGE_SIZE);
    loadList(next);
  };

  const handleDeleteConversation = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.id <= 0 || pendingDelete.source === "contact_us") {
      toast.error("Contact Us submissions cannot be deleted here");
      setPendingDelete(null);
      return;
    }
    const removed = pendingDelete;
    setDeleting(true);
    setConversations((prev) => prev.filter((c) => c.id !== removed.id));
    setPendingDelete(null);
    try {
      await adminMessagingService.deleteConversation(removed.id);
      toast.success("Conversation archived");
      if (conversationId && Number(conversationId) === removed.id) {
        navigate("/admin/messages");
      }
    } catch (e: unknown) {
      setConversations((prev) => [removed, ...prev]);
      toast.error(e instanceof Error ? e.message : "Failed to delete conversation");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds].filter((id) => id > 0);
    if (ids.length === 0) return;
    setDeleting(true);
    setPendingBulkDelete(false);
    try {
      const res = await adminMessagingService.bulkDeleteConversations(ids);
      setConversations((prev) => prev.filter((c) => !ids.includes(c.id)));
      setSelectedIds(new Set());
      toast.success(
        `Archived ${res.deleted ?? ids.length} conversation${(res.deleted ?? ids.length) === 1 ? "" : "s"}`,
      );
      if (conversationId && ids.includes(Number(conversationId))) {
        navigate("/admin/messages");
      }
      loadList();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Bulk delete failed");
    } finally {
      setDeleting(false);
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
                  {thread.conversation.source === "contact_us"
                    ? "Contact Us submission"
                    : `Re: ${thread.conversation.artisanName ?? thread.conversation.providerName}`}
                </p>
                {thread.conversation.contactEmail && (
                  <p className="text-xs text-muted-foreground">{thread.conversation.contactEmail}</p>
                )}
              </div>

              {thread.conversation.artisanNote && (
                <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30" data-testid="admin-private-note">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Private note
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    From artisan — not visible to customer
                  </p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{thread.conversation.artisanNote}</p>
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
                    {m.content ? <p>{m.content}</p> : null}
                    {m.attachment?.kind === "voice" ? (
                      <div className="mt-2">
                        <VoiceMessagePlayer
                          attachmentPath={m.attachment.url}
                          durationMs={m.attachment.durationMs ?? m.durationMs}
                        />
                      </div>
                    ) : m.attachment ? (
                      <button
                        type="button"
                        className="text-xs underline mt-1 inline-block text-left"
                        onClick={async () => {
                          try {
                            const blobUrl = await messagingService.fetchAttachmentBlobUrl(
                              m.attachment!.url,
                            );
                            window.open(blobUrl, "_blank", "noopener,noreferrer");
                          } catch {
                            toast.error("Could not open attachment");
                          }
                        }}
                      >
                        {m.attachment.kind === "image" ? "View image" : "Download"}: {m.attachment.name}
                      </button>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(m.sentAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </Card>

              {thread.conversation.source !== "contact_us" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reply as MoE Support</label>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    rows={4}
                    disabled={sending || sendingVoice}
                  />
                  <VoiceComposer
                    disabled={sending}
                    sending={sendingVoice}
                    onSend={handleSendVoice}
                    className="w-full"
                  />
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button
                      onClick={handleSendReply}
                      disabled={sending || sendingVoice || !reply.trim()}
                    >
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
              )}
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

        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-wrap gap-2 items-center"
          data-testid="admin-messages-search"
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, artisan, subject, ID, message…"
              className="pl-9"
              aria-label="Search conversations"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isLoading}>
            Search
          </Button>
          {searchQuery ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                loadList("");
              }}
            >
              Clear search
            </Button>
          ) : null}
        </form>

        {!isLoading && (
          <div role="tablist" aria-label="Message types" className="flex flex-wrap gap-2 border-b border-border">
            {CATEGORY_TABS.map((t) => {
              const count = conversations.filter(t.match).length;
              const active = category === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(t.key)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {selectedIds.size > 0 ? (
          <div
            className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2"
            data-testid="admin-messages-selection-bar"
          >
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setPendingBulkDelete(true)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Bulk Delete
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : conversations.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No conversations match your search" : "No conversations yet"}
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No messages in this category</Card>
        ) : (
          <div className="space-y-2">
            {visibleSelectableIds.length > 0 ? (
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  id="admin-messages-select-all"
                  checked={allVisibleSelected}
                  onCheckedChange={(v) => toggleSelectAllVisible(v === true)}
                  aria-label="Select all on this page"
                  data-testid="admin-messages-select-all"
                />
                <label htmlFor="admin-messages-select-all" className="text-sm text-muted-foreground">
                  Select all on this page
                </label>
              </div>
            ) : null}
            {visibleRows.map((c) => {
              const selectable = c.source !== "contact_us" && c.id > 0;
              return (
                <Card
                  key={c.id}
                  className="p-4 hover:border-primary transition-colors"
                  data-testid="admin-message-row"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {selectable ? (
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={(v) => toggleSelect(c.id, v === true)}
                          aria-label={`Select conversation ${c.id}`}
                          className="mt-1"
                          data-testid="admin-message-select"
                        />
                      ) : (
                        <span className="w-4" />
                      )}
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => navigate(`/admin/messages/${c.id}`)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{c.customerName}</h3>
                          {c.source === "contact_us" ? (
                            <Badge variant="secondary" className="text-xs">
                              Contact Us
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Re: {c.artisanName ?? c.providerName}
                            </Badge>
                          )}
                          {c.unreadCount > 0 && <Badge>New</Badge>}
                          {c.id > 0 ? (
                            <span className="text-[10px] text-muted-foreground">#{c.id}</span>
                          ) : null}
                        </div>
                        {(c.customerEmail || c.contactEmail) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {c.customerEmail || c.contactEmail}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {c.lastMessage}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <div className="text-right">
                        <Badge variant="secondary">
                          {STATUS_LABELS[c.status ?? "unread"] ?? c.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(c.lastMessageAt ?? c.lastMessageTime).toLocaleDateString()}
                        </p>
                      </div>
                      {selectable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Conversation actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setPendingDelete(c)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
            {filtered.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                  Show more ({filtered.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              The conversation will be removed from active lists. Messages and attachments are
              retained for audit history and are not permanently destroyed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteConversation()} disabled={deleting}>
              {deleting ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingBulkDelete} onOpenChange={setPendingBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {selectedIds.size} conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              Selected conversations will leave active lists. Related user accounts, orders, and
              products are not affected. Message history is retained for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleBulkDelete()} disabled={deleting}>
              {deleting ? "Archiving..." : "Archive selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMessages;
