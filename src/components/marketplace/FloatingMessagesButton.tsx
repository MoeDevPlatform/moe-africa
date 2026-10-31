import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, MessageCircle, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { messagingService, type Conversation } from "@/lib/apiServices";
import { useMessagingDock, type MessagingDockTarget } from "@/contexts/MessagingDockContext";
import ChatThread from "@/components/marketplace/ChatThread";

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

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Persistent messaging button that expands into a compact conversation panel. */
const FloatingMessagesButton = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { request } = useMessagingDock();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<MessagingDockTarget | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listStatus, setListStatus] = useState<ListStatus>("loading");
  const [listAttempt, setListAttempt] = useState(0);

  const visible = isMessagingSurface(location.pathname);
  const canCountUnread =
    isAuthenticated && (user?.role === "customer" || user?.role === "artisan");

  useEffect(() => {
    if (!request || !visible) return;
    setActive(request.target);
    setOpen(true);
  }, [request, visible]);

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible, location.pathname]);

  useEffect(() => {
    if (!visible || !canCountUnread) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = () => {
      messagingService
        .listConversations()
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
        setOpen(false);
        setActive(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || active) return;
    let cancelled = false;

    if (!isAuthenticated) {
      setConversations([]);
      setListStatus("ready");
      return;
    }

    setListStatus("loading");
    messagingService
      .listConversations()
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
      });

    return () => {
      cancelled = true;
    };
  }, [open, active, isAuthenticated, listAttempt]);

  if (!visible) return null;

  const closePanel = () => {
    setOpen(false);
    setActive(null);
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
    setOpen(true);
  };

  const title = active ? `Re: ${active.providerName}` : "Messages";

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
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg bottom-4 right-4 w-[min(22.5rem,calc(100vw-1.5rem))] h-[min(36rem,calc(100dvh-6.5rem))] max-sm:left-3 max-sm:right-3 max-sm:bottom-3 max-sm:w-auto max-sm:h-[min(32rem,calc(100dvh-8.5rem))]"
        >
          <div className="shrink-0 bg-primary text-primary-foreground px-3 py-3 flex items-center gap-2">
            {active ? (
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
              {title}
            </h2>
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

          {active ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <ChatThread
                key={`${active.providerId}-${active.conversationId ?? "new"}`}
                embedded
                providerId={active.providerId}
                providerName={active.providerName}
                initialConversationId={active.conversationId}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-background">
              {!isAuthenticated ? (
                <div className="px-6 py-12 text-center space-y-3" data-testid="messages-panel-signed-out">
                  <p className="text-sm text-muted-foreground">Sign in to see your conversations.</p>
                  <Button type="button" size="sm" onClick={() => navigate("/auth?tab=signin")}>
                    Sign in
                  </Button>
                </div>
              ) : listStatus === "loading" ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground" data-testid="messages-panel-loading">
                  Loading conversations…
                </p>
              ) : listStatus === "error" ? (
                <div className="px-6 py-12 text-center space-y-3" data-testid="messages-panel-error">
                  <p className="text-sm text-muted-foreground">Couldn&apos;t load your conversations.</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => setListAttempt((n) => n + 1)}>
                    Try again
                  </Button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-6 py-12 text-center" data-testid="messages-panel-empty">
                  <p className="font-medium text-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Message an artisan from their page to start a conversation.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {conversations.map((conversation) => {
                    const unreadCount = Number(conversation.unreadCount) || 0;
                    const name = conversation.providerName || "Artisan";
                    return (
                      <li key={conversation.id}>
                        <button
                          type="button"
                          data-testid="messages-panel-conversation"
                          className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/70 transition-colors"
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
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingMessagesButton;
