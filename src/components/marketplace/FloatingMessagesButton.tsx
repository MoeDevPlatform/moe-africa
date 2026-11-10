import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Maximize2, MessageCircle, Minimize2, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { messagingService, type Conversation } from "@/lib/apiServices";
import { useMessagingDock, type MessagingDockTarget } from "@/contexts/MessagingDockContext";
import ChatThread from "@/components/marketplace/ChatThread";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Marketplace, artisan dashboard, and customer help — not the welcome page, auth, or admin. */
export function isMessagingSurface(pathname: string): boolean {
  if (pathname === "/") return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/admin")) return false;
  return (
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/artisan") ||
    pathname.startsWith("/help")
  );
}

type ListStatus = "loading" | "ready" | "error";
type ViewMode = "compact" | "expanded";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function draftKeyFor(target: MessagingDockTarget) {
  return `${target.providerId}:${target.conversationId ?? "new"}`;
}

/** Persistent messaging button that expands into a compact or full-view conversation panel. */
const FloatingMessagesButton = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { request } = useMessagingDock();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [active, setActive] = useState<MessagingDockTarget | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listStatus, setListStatus] = useState<ListStatus>("loading");
  const [listAttempt, setListAttempt] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [scrollTops, setScrollTops] = useState<Record<string, number>>({});

  const visible = isMessagingSurface(location.pathname);
  const canCountUnread =
    isAuthenticated && (user?.role === "customer" || user?.role === "artisan");
  const expanded = viewMode === "expanded";
  const activeDraftKey = active ? draftKeyFor(active) : null;

  useEffect(() => {
    if (!request || !visible) return;
    setActive(request.target);
    setOpen(true);
  }, [request, visible]);

  useEffect(() => {
    if (!visible) {
      setOpen(false);
      setViewMode("compact");
    }
  }, [visible, location.pathname]);

  useEffect(() => {
    if (!visible || !canCountUnread) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = () => {
      messagingService
        // Personal inbox only — never inbound provider inquiries.
        .listConversations({ as: "customer" })
        .then((res) => {
          if (cancelled) return;
          const total = (res.data ?? []).reduce(
            (sum, c) => sum + (Number(c.unreadCount) || 0),
            0,
          );
          setUnread(total);
        })
        .catch(() => {
          if (!cancelled) setUnread(0);
        });
    };
    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [visible, canCountUnread, location.pathname, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (expanded) {
          setViewMode("compact");
          return;
        }
        setOpen(false);
        setActive(null);
        setViewMode("compact");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, expanded]);

  const shouldLoadList = open && (expanded || !active);

  useEffect(() => {
    if (!shouldLoadList) return;
    let cancelled = false;

    if (!isAuthenticated) {
      setConversations([]);
      setListStatus("ready");
      return;
    }

    setListStatus("loading");
    messagingService
      .listConversations({ as: "customer" })
      .then((res) => {
        if (cancelled) return;
        const rows = [...(res.data ?? [])].sort(
          (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
        );
        setConversations(rows);
        setListStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setListStatus("error");
        toast.error("Couldn't load conversations");
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoadList, isAuthenticated, listAttempt]);

  const conversationList = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <div className="px-6 py-12 text-center space-y-3" data-testid="messages-panel-signed-out">
          <p className="text-sm text-muted-foreground">Sign in to see your conversations.</p>
          <Button type="button" size="sm" onClick={() => navigate("/auth?tab=signin")}>
            Sign in
          </Button>
        </div>
      );
    }
    if (listStatus === "loading") {
      return (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground" data-testid="messages-panel-loading">
          Loading conversations…
        </p>
      );
    }
    if (listStatus === "error") {
      return (
        <div className="px-6 py-12 text-center space-y-3" data-testid="messages-panel-error">
          <p className="text-sm text-muted-foreground">Couldn&apos;t load your conversations.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setListAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      );
    }
    if (conversations.length === 0) {
      return (
        <div className="px-6 py-12 text-center" data-testid="messages-panel-empty">
          <p className="font-medium text-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Message an artisan from their page to start a conversation.
          </p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-border">
        {conversations.map((conversation) => {
          const unreadCount = Number(conversation.unreadCount) || 0;
          const name = conversation.providerName || "Artisan";
          const isActive =
            active?.conversationId === conversation.id ||
            (!active?.conversationId && active?.providerId === conversation.providerId);
          return (
            <li key={conversation.id}>
              <button
                type="button"
                data-testid="messages-panel-conversation"
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/70 transition-colors",
                  isActive && "bg-muted",
                )}
                onClick={() =>
                  setActive({
                    conversationId: conversation.id,
                    providerId: conversation.providerId,
                    providerName: name,
                  })
                }
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium truncate">Re: {name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatWhen(conversation.lastMessageTime)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {conversation.lastMessage || "No messages yet"}
                    </span>
                    {unreadCount > 0 ? (
                      <span
                        data-testid="messages-panel-unread"
                        className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold flex items-center justify-center"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }, [active, conversations, isAuthenticated, listStatus, navigate]);

  if (!visible) return null;

  const closePanel = () => {
    setOpen(false);
    setActive(null);
    setViewMode("compact");
  };

  const openMessages = () => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate("/auth?tab=signin");
      return;
    }
    if (user?.role === "admin") {
      navigate("/admin/messages");
      return;
    }
    setActive(null);
    setViewMode("compact");
    setOpen(true);
  };

  const title = active ? `Re: ${active.providerName}` : "Messages";

  const thread =
    active && activeDraftKey ? (
      <ChatThread
        key={`${active.providerId}-${active.conversationId ?? "new"}`}
        embedded
        providerId={active.providerId}
        providerName={active.providerName}
        initialConversationId={active.conversationId}
        draft={drafts[activeDraftKey] ?? ""}
        onDraftChange={(value) =>
          setDrafts((prev) => ({ ...prev, [activeDraftKey]: value }))
        }
        scrollTop={scrollTops[activeDraftKey] ?? 0}
        onScrollTopChange={(value) =>
          setScrollTops((prev) => ({ ...prev, [activeDraftKey]: value }))
        }
      />
    ) : null;

  return (
    <>
      {!open && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-testid="floating-messages-btn"
                onClick={openMessages}
                aria-expanded={false}
                className="fixed bottom-36 right-4 sm:right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
                aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
              >
                <MessageCircle className="h-5 w-5" />
                {unread > 0 ? (
                  <span
                    data-testid="floating-messages-unread"
                    className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold flex items-center justify-center"
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">{unread > 0 ? `${unread} unread` : "Messages"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {open && (
        <div
          id="messages-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="messages-panel-title"
          data-testid="messages-panel"
          data-view-mode={viewMode}
          className={cn(
            "fixed z-[80] flex flex-col overflow-hidden border border-border bg-card shadow-lg",
            expanded
              ? "top-20 left-3 right-3 bottom-3 sm:top-24 sm:left-6 sm:right-6 sm:bottom-6 rounded-2xl"
              : "rounded-2xl bottom-4 right-4 w-[min(22.5rem,calc(100vw-1.5rem))] h-[min(36rem,calc(100dvh-6.5rem))] max-sm:left-3 max-sm:right-3 max-sm:bottom-3 max-sm:w-auto max-sm:h-[min(32rem,calc(100dvh-8.5rem))]",
          )}
        >
          <div className="shrink-0 bg-primary text-primary-foreground px-3 py-3 flex items-center gap-2">
            {active && !expanded ? (
              <button
                type="button"
                data-testid="messages-panel-back"
                onClick={() => setActive(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary-foreground/15"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <span className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </span>
            )}
            <h2 id="messages-panel-title" className="font-semibold text-base flex-1 truncate">
              {expanded ? "Messages" : title}
            </h2>
            {expanded ? (
              <button
                type="button"
                data-testid="messages-panel-minimize"
                onClick={() => setViewMode("compact")}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary-foreground/15"
                aria-label="Minimize messages"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                data-testid="messages-panel-expand"
                onClick={() => setViewMode("expanded")}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary-foreground/15"
                aria-label="Expand messages"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              data-testid="messages-panel-close"
              onClick={closePanel}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary-foreground/15"
              aria-label="Close messages"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {expanded ? (
            <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
              <div
                className={cn(
                  "sm:w-[min(22rem,40%)] sm:border-r border-border bg-background overflow-y-auto overscroll-contain",
                  active ? "hidden sm:block sm:h-full" : "flex-1 min-h-0",
                )}
                data-testid="messages-panel-list"
              >
                {conversationList}
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                {active ? (
                  <>
                    <div className="sm:hidden shrink-0 px-3 py-2 border-b flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="messages-panel-back"
                        onClick={() => setActive(null)}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
                        aria-label="Back to conversations"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <p className="font-medium truncate">Re: {active.providerName}</p>
                    </div>
                    <div className="hidden sm:flex shrink-0 px-4 py-3 border-b items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {active.providerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">Re: {active.providerName}</p>
                        <p className="text-xs text-muted-foreground">Replies from MoE Support</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col">{thread}</div>
                  </>
                ) : (
                  <div
                    className="hidden sm:flex flex-1 items-center justify-center text-sm text-muted-foreground px-6 text-center"
                    data-testid="messages-panel-select-prompt"
                  >
                    Select a conversation to start messaging.
                  </div>
                )}
              </div>
            </div>
          ) : active ? (
            <div className="flex-1 min-h-0 flex flex-col">{thread}</div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-background">
              {conversationList}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingMessagesButton;
