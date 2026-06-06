import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { messagingService } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  id?: number;
  providerId: number;
  providerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  createdBy?: number;
  createdAt?: string;
}

const LOCAL_STUB_TTL_MS = 30 * 60 * 1000;

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const listKey = `conversations_${user?.id != null ? String(user.id) : "guest"}`;
  const scope = user?.id != null ? String(user.id) : "guest";
  const tombstoneKey = `conversations_tombstones_${scope}`;
  const clearedAtKey = `conversations_cleared_at_${scope}`;

  const readTombstones = (): Set<number> => {
    try {
      const raw = localStorage.getItem(tombstoneKey);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map((n: unknown) => Number(n)).filter((n) => Number.isFinite(n)) : []);
    } catch { return new Set(); }
  };
  const writeTombstones = (set: Set<number>) => {
    try { localStorage.setItem(tombstoneKey, JSON.stringify([...set])); } catch { /* noop */ }
  };
  const addTombstone = (id: number) => {
    const s = readTombstones();
    s.add(id);
    writeTombstones(s);
  };
  const readClearedAt = (): number => {
    try { return Number(localStorage.getItem(clearedAtKey)) || 0; } catch { return 0; }
  };

  useEffect(() => {
    let cancelled = false;

    const readLocal = (): Conversation[] => {
      try {
        const raw = localStorage.getItem(listKey);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed.map((c: any) => ({
          id: c.id,
          providerId: c.providerId,
          providerName: c.providerName,
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          unread: !!c.unread,
          createdBy: c.createdBy,
          createdAt: c.createdAt,
        }));
      } catch {
        return [];
      }
    };

    const loadConversations = async () => {
      const local = readLocal();
      try {
        const res = await messagingService.listConversations();
        if (cancelled) return;
        const tombstones = readTombstones();
        const clearedAt = readClearedAt();
        const server: Conversation[] = res.data
          .filter((c) => !tombstones.has(c.id))
          .filter((c) => {
            if (!clearedAt) return true;
            const t = new Date(c.lastMessageTime).getTime();
            return Number.isFinite(t) ? t > clearedAt : true;
          })
          .map((c) => ({
          id: c.id,
          providerId: c.providerId,
          providerName: c.providerName,
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          unread: c.unreadCount > 0,
        }));
        // Issue #1 — strict merge. Only keep local stub if created by current
        // user within last 30 min AND server hasn't surfaced it yet. Prevents
        // cross-account stale leakage.
        const seen = new Set(server.map((c) => c.providerId));
        const now = Date.now();
        const keptLocal = local.filter((c) => {
          if (seen.has(c.providerId)) return false;
          if (!user?.id || c.createdBy !== user.id) return false;
          if (!c.createdAt) return false;
          return now - new Date(c.createdAt).getTime() < LOCAL_STUB_TTL_MS;
        });
        const merged = [...server, ...keptLocal];
        try { localStorage.setItem(listKey, JSON.stringify(merged)); } catch { /* noop */ }
        setConversations(merged);
      } catch {
        if (!cancelled) setConversations(local);
      }
    };

    loadConversations();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadConversations();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [listKey, user?.id]);

  const handleOpenConversation = (conversation: Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.providerId === conversation.providerId ? { ...c, unread: false } : c)),
    );
    if (conversation.id) {
      navigate(`/marketplace/messages/${conversation.id}`);
    } else {
      navigate(
        `/marketplace/messages/0?providerId=${conversation.providerId}&providerName=${encodeURIComponent(conversation.providerName)}`,
      );
    }
  };

  const clearLocalConversationCache = () => {
    try {
      const scope = user?.id != null ? String(user.id) : "guest";
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k === `conversations_${scope}` || k.startsWith(`conversation_${scope}_`))) {
          localStorage.removeItem(k);
        }
      }
    } catch { /* noop */ }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const res = await messagingService.deleteAllConversations();
      clearLocalConversationCache();
      try { localStorage.setItem(clearedAtKey, String(Date.now())); } catch { /* noop */ }
      // Also tombstone every currently-known server id in case the backend
      // returns the same rows again before the cleared-at filter would help.
      const s = readTombstones();
      conversations.forEach((c) => { if (c.id != null) s.add(c.id); });
      writeTombstones(s);
      setConversations([]);
      toast({
        title: "Conversations cleared",
        description: `${res?.deleted ?? 0} conversation${(res?.deleted ?? 0) === 1 ? "" : "s"} removed.`,
      });
    } catch (err: any) {
      // Even if backend endpoint isn't deployed yet, wipe local cache so QA can proceed.
      clearLocalConversationCache();
      try { localStorage.setItem(clearedAtKey, String(Date.now())); } catch { /* noop */ }
      const s = readTombstones();
      conversations.forEach((c) => { if (c.id != null) s.add(c.id); });
      writeTombstones(s);
      setConversations([]);
      toast({
        title: "Local cache cleared",
        description: "Backend delete failed — server conversations may reappear on refresh.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteOne = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!conversation.id) {
      setConversations((prev) => prev.filter((c) => c.providerId !== conversation.providerId));
      try {
        localStorage.removeItem(`conversation_${scope}_${conversation.providerId}`);
      } catch { /* noop */ }
      return;
    }
    setDeletingId(conversation.id);
    try {
      await messagingService.deleteConversation(conversation.id);
      addTombstone(conversation.id);
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      try {
        localStorage.removeItem(`conversation_${scope}_${conversation.providerId}`);
      } catch { /* noop */ }
      toast({ title: "Conversation deleted" });
    } catch {
      // Backend may not yet implement DELETE — tombstone locally so the row
      // doesn't reappear on refresh and QA can keep testing.
      addTombstone(conversation.id);
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      try {
        localStorage.removeItem(`conversation_${scope}_${conversation.providerId}`);
      } catch { /* noop */ }
      toast({
        title: "Conversation hidden",
        description: "Removed from your inbox (backend delete pending).",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">Messages</h1>
              <p className="text-muted-foreground">Your conversations with service providers</p>
            </div>
            {conversations.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={clearing} aria-label="Clear all conversations">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {clearing ? "Clearing..." : "Clear all"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes every conversation and message in your inbox. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll}>Delete all</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {conversations.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">No messages yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation with a service provider to see it here
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations
                .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
                .map((conversation) => (
                  <Card
                    key={`${conversation.id ?? "local"}_${conversation.providerId}`}
                    className="p-4 hover:border-primary cursor-pointer transition-all"
                    onClick={() => handleOpenConversation(conversation)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conversation.providerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold">{conversation.providerName}</h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(conversation.lastMessageTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unread && <Badge variant="default" className="shrink-0">New</Badge>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteOne(conversation, e)}
                        disabled={deletingId === conversation.id}
                        aria-label={`Delete conversation with ${conversation.providerName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default Messages;
