const LEGACY_KEY = "moe_notifications";

export function clearNotificationCache() {
  try {
    localStorage.removeItem(LEGACY_KEY);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("moe_notifications:")) {
        localStorage.removeItem(key);
      }
    }
  } catch { /* noop */ }
}
