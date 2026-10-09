import { useCallback, useEffect, useState } from "react";
import { isRateLimitError } from "@/lib/authErrors";

const COOLDOWN_SECONDS = 60;

export function useAuthRateLimitCooldown() {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const applyRateLimit = useCallback((err: unknown): boolean => {
    if (!isRateLimitError(err)) return false;
    setCooldown(COOLDOWN_SECONDS);
    return true;
  }, []);

  const cooldownLabel =
    cooldown > 0 ? `Try again in ${cooldown}s...` : undefined;

  return {
    cooldown,
    isCoolingDown: cooldown > 0,
    cooldownLabel,
    applyRateLimit,
  };
}
