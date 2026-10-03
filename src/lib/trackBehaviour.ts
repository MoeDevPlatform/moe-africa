import { eventsService } from "@/lib/apiServices";

const SESSION_KEY = "moe_behaviour_session_id";

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

/** Fire-and-forget tracker usable outside React components. */
export function trackBehaviour(
  eventType: string,
  opts: {
    entityType?: string;
    entityId?: string | number;
    metadata?: Record<string, unknown>;
  } = {},
) {
  try {
    void eventsService
      .track({
        sessionId: sessionId(),
        eventType,
        entityType: opts.entityType,
        entityId: opts.entityId != null ? String(opts.entityId) : undefined,
        metadata: opts.metadata,
      })
      .catch(() => {});
  } catch {
    /* ignore */
  }
}
