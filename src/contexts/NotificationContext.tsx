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
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  refresh: () => Promise<void>;
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

const fromApi = (n: ApiNotification): Notification => ({
  id: String(n.id),
  type: mapType(n.type),
  title: n.title,
  message: n.body,
  timestamp: new Date(n.createdAt),
  read: n.read,
  link: n.link,
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Wipe legacy global cache once — it leaked between accounts on the same browser.
  useEffect(() => {
    try { localStorage.removeItem(LEGACY_KEY); } catch { /* noop */ }
  }, []);

  const loadFromCache = useCallback((uid: string | number): Notification[] => {
    try {
      const raw = localStorage.getItem(cacheKey(uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
    } catch { return []; }
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }
    try {
      const res = await notificationsService.list();
      // Backend returns { data, pagination }; tolerate raw array fallback too.
      const rows: ApiNotification[] = Array.isArray(res) ? res : (res?.data ?? []);
      const mapped = rows.map(fromApi);
      setNotifications(mapped);
      try { localStorage.setItem(cacheKey(user.id), JSON.stringify(mapped)); } catch { /* noop */ }
    } catch {
      // Network/API down: fall back to per-user cache so the bell isn't empty.
      setNotifications(loadFromCache(user.id));
    }
  }, [isAuthenticated, user?.id, loadFromCache]);

  // Load + poll while signed in. Reset on logout.
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }
    setNotifications(loadFromCache(user.id)); // instant paint
    refresh();
    pollRef.current = setInterval(refresh, 30_000);
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [isAuthenticated, user?.id, refresh, loadFromCache]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification: NotificationContextType["addNotification"] = (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const numeric = Number(id);
    if (!Number.isNaN(numeric) && isAuthenticated) {
      notificationsService.markRead(numeric).catch(() => { /* silent */ });
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (isAuthenticated) {
      notificationsService.markAllRead().catch(() => { /* silent */ });
    }
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
