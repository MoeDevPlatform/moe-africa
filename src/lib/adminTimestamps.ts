/** Local display for stored UTC timestamps: `24 Oct 2026, 2:35 PM`. */
export function formatAdminTimestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hour = date.getHours();
  const hour12 = hour % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, "0");
  const suffix = hour < 12 ? "AM" : "PM";
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hour12}:${minute} ${suffix}`;
}
