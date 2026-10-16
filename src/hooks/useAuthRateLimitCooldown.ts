import { useCallback, useEffect, useState } from "react";
import { isRateLimitError, rateLimitCooldownSeconds } from "@/lib/authErrors";

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
    setCooldown(rateLimitCooldownSeconds(err));
    return true;
  }, []);

  const cooldownLabel =
    cooldown > 0
      ? cooldown >= 60
        ? `Try again in ${Math.ceil(cooldown / 60)} min...`
        : `Try again in ${cooldown}s...`
      : undefined;

  return {
    cooldown,
    isCoolingDown: cooldown > 0,
    cooldownLabel,
    applyRateLimit,
  };
}
