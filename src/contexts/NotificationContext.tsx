import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { notificationsService, Notification as ApiNotification } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";
import { clearNotificationCache } from "@/lib/notificationCache";

export interface Notification {
  id: string;
  userId?: number;
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
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const mapType = (t: ApiNotification["type"]): Notification["type"] => {
  switch (t) {
    case "order_update": return "order_status";
    case "message": return "message";
    case "promotion": return "promo";
    case "product_removed_by_admin": return "response";
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
  userId: n.userId,
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<number | null>(null);

  useEffect(() => {
    clearNotificationCache();
  }, []);

  const refresh = useCallback(async () => {
    const uid = user?.id;
    if (!isAuthenticated || uid == null) {
      setNotifications([]);
      userIdRef.current = null;
      return;
    }
    userIdRef.current = uid;

    const res = await notificationsService.list({ unread: true });
    const rows: ApiNotification[] = Array.isArray(res) ? res : (res?.data ?? []);
    const mapped = rows
      .map(fromApi)
      .filter((n) => n.userId == null || n.userId === uid);
    setNotifications(mapped);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!isAuthenticated || user?.id == null) {
      setNotifications([]);
      userIdRef.current = null;
      return;
    }
    refresh().catch(() => setNotifications([]));
    pollRef.current = setInterval(() => {
      refresh().catch(() => { /* keep last good state */ });
    }, 30_000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification: NotificationContextType["addNotification"] = (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      userId: user?.id,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const removeFromState = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAsRead = async (id: string) => {
    const numeric = Number(id);
    removeFromState(id);
    if (!Number.isNaN(numeric) && isAuthenticated) {
      try {
        await notificationsService.markRead(numeric);
      } catch {
        await refresh().catch(() => {});
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications([]);
    if (isAuthenticated) {
      try {
        await notificationsService.markAllRead();
      } catch {
        await refresh().catch(() => setNotifications([]));
      }
    }
  };

  const clearNotification = async (id: string) => {
    await markAsRead(id);
  };

  const clearAll = () => {
    void markAllAsRead();
  };

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
