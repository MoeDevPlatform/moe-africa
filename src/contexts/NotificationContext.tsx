import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { notificationsService, Notification as ApiNotification } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: "quote" | "response" | "order_status" | "wishlist" | "promo" | "custom_order" | "message";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  icon?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAll: () => void;
  refresh: (options?: { unreadOnly?: boolean }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const cacheKey = (userId: string | number) => `moe_notifications:${userId}`;
const LEGACY_KEY = "moe_notifications";

const mapType = (t: ApiNotification["type"]): Notification["type"] => {
  switch (t) {
    case "order_update": return "order_status";
    case "message": return "message";
    case "promotion": return "promo";
    case "system":
    default: return "response";
  }
};

const rewriteLink = (link?: string | null): string | undefined => {
  if (!link || link.includes("undefined")) return "/marketplace/messages";

  const queryMatch = link.match(/^[\/]?messages\?c=(\d+)/);
  if (queryMatch) return `/marketplace/messages/${queryMatch[1]}`;

  const pathMatch = link.match(/^[\/]?messages\/(\d+)/);
  if (pathMatch) return `/marketplace/messages/${pathMatch[1]}`;

  if (link.startsWith("/marketplace/")) return link;
  if (link.startsWith("/")) return link;
  return link;
};

const fromApi = (n: ApiNotification): Notification => ({
  id: String(n.id),
  type: mapType(n.type),
  title: n.title,
  message: n.body,
  timestamp: new Date(n.createdAt),
  read: n.read,
  link: rewriteLink(n.link),
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadPoll, setUnreadPoll] = useState<Notification[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try { localStorage.removeItem(LEGACY_KEY); } catch { /* noop */ }
  }, []);

  const refresh = useCallback(async (options?: { unreadOnly?: boolean }) => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setUnreadPoll([]);
      return;
    }
    try {
      const res = await notificationsService.list(
        options?.unreadOnly ? { unread: true } : undefined,
      );
      const rows: ApiNotification[] = Array.isArray(res) ? res : (res?.data ?? []);
      const mapped = rows.map(fromApi);
      if (options?.unreadOnly) {
        setUnreadPoll(mapped);
      } else {
        setNotifications(mapped);
        try { localStorage.setItem(cacheKey(user.id), JSON.stringify(mapped)); } catch { /* noop */ }
      }
    } catch {
      if (!options?.unreadOnly && user?.id) {
        try {
          const raw = localStorage.getItem(cacheKey(user.id));
          if (raw) {
            const parsed = JSON.parse(raw);
            setNotifications(
              parsed.map((n: Notification) => ({ ...n, timestamp: new Date(n.timestamp) })),
            );
          }
        } catch { /* noop */ }
      }
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setUnreadPoll([]);
      return;
    }
    refresh({ unreadOnly: true });
    pollRef.current = setInterval(() => refresh({ unreadOnly: true }), 30_000);
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [isAuthenticated, user?.id, refresh]);

  const unreadCount = unreadPoll.filter((n) => !n.read).length;

  const addNotification: NotificationContextType["addNotification"] = (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string) => {
    const numeric = Number(id);
    if (!Number.isNaN(numeric) && isAuthenticated) {
      await notificationsService.markRead(numeric);
      await refresh({ unreadOnly: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const markAllAsRead = async () => {
    if (isAuthenticated) {
      await notificationsService.markAllRead();
      await refresh({ unreadOnly: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const clearNotification = async (id: string) => {
    await markAsRead(id);
  };

  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
