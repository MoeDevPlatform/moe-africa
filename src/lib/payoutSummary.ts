import type { ArtisanPayoutBundle } from "@/lib/apiServices";

/** Aggregates existing per-order payout records; derives nothing that isn't in them. */
export function summarisePayouts(bundles: ArtisanPayoutBundle[]) {
  let verified = 0, pending = 0, materialFunding = 0, outstanding = 0;
  let currency = "NGN";
  const history: Array<ArtisanPayoutBundle["payout"] extends infer P ? P extends { transfers: Array<infer T> } ? T & { orderId: number } : never : never> = [];
  for (const b of bundles) {
    const p = b.payout;
    if (!p || p.status === "not_required" || p.status === "reversed") continue;
    currency = p.currency || currency;
    verified += p.verifiedTotal ?? 0;
    const recordedUnverified = p.transfers.filter((t) => t.status !== "verified" && t.status !== "rejected").reduce((n, t) => n + t.amount, 0);
    pending += recordedUnverified;
    if (p.fundingRequired && p.approvedAmount != null) materialFunding += p.approvedAmount;
    if (p.approvedAmount != null) outstanding += Math.max(0, p.approvedAmount - (p.verifiedTotal ?? 0) - recordedUnverified);
    for (const t of p.transfers) history.push({ ...t, orderId: b.orderId });
  }
  history.sort((a, b) => Date.parse(b.transferDate) - Date.parse(a.transferDate));
  return { verified, pending, materialFunding, outstanding, currency, history };
}
