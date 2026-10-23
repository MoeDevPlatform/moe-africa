import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { messagingService } from "@/lib/apiServices";

/**
 * Persistent floating entry to marketplace messaging for signed-in customers.
 * Stacked above the refresh FAB. Uses listConversations unread counts.
 */
const FloatingMessagesButton = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const hideOnAuth =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/artisan");

  const show = Boolean(isAuthenticated && user?.role === "customer" && !hideOnAuth);

  useEffect(() => {
    if (!show) {
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
  }, [show, location.pathname]);

  if (!show) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid="floating-messages-btn"
            onClick={() => navigate("/marketplace/messages")}
            className="fixed bottom-20 right-6 z-50 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
            aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
          >
            <MessageCircle className="h-5 w-5" />
            {unread > 0 ? (
              <span
                data-testid="floating-messages-unread"
                className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center"
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
  );
};

export default FloatingMessagesButton;
