import { useCallback } from "react";
import { trackBehaviour } from "@/lib/trackBehaviour";

type TrackOptions = {
  entityType?: string;
  entityId?: string | number;
  metadata?: Record<string, unknown>;
};

/**
 * Fire-and-forget behaviour tracking. Never blocks UI or surfaces errors.
 */
export function useBehaviourTracking() {
  const track = useCallback((eventType: string, opts: TrackOptions = {}) => {
    trackBehaviour(eventType, opts);
  }, []);

  return { track };
}
