import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MessagingDockTarget {
  providerId: number;
  providerName: string;
  conversationId?: number;
}

interface DockRequest {
  nonce: number;
  target: MessagingDockTarget | null;
}

interface MessagingDockContextValue {
  request: DockRequest | null;
  /** Open the floating panel. Pass a target to jump straight into that artisan's thread. */
  openDock: (target?: MessagingDockTarget | null) => void;
}

const MessagingDockContext = createContext<MessagingDockContextValue | null>(null);

export function MessagingDockProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DockRequest | null>(null);

  const openDock = useCallback((target?: MessagingDockTarget | null) => {
    setRequest({ nonce: Date.now(), target: target ?? null });
  }, []);

  const value = useMemo(() => ({ request, openDock }), [request, openDock]);

  return <MessagingDockContext.Provider value={value}>{children}</MessagingDockContext.Provider>;
}

export function useMessagingDock() {
  const ctx = useContext(MessagingDockContext);
  if (!ctx) {
    throw new Error("useMessagingDock must be used within MessagingDockProvider");
  }
  return ctx;
}
