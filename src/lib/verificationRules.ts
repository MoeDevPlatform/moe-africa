import type { VerificationDocument, VerificationDocumentType } from "@/lib/apiServices";

export type BusinessType = "individual" | "registered_business";

/** Stable identity: one slot per fixed type, one per named "Other" document. */
export function documentKey(type: VerificationDocumentType, name?: string | null): string {
  if (type !== "other") return type;
  const slug = (name ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `other:${slug}`;
}

export function keyOf(doc: VerificationDocument): string {
  return doc.documentKey || documentKey(doc.type, doc.documentName);
}

/** Collapse repeated rows (same id) and keep the latest submission per identity as the active one. */
export function groupDocuments(docs: VerificationDocument[]) {
  const unique = [...new Map(docs.map((d) => [d.id, d])).values()];
  const groups = new Map<string, VerificationDocument[]>();
  for (const d of unique) {
    const k = keyOf(d);
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  return [...groups.entries()].map(([key, rows]) => {
    const sorted = rows.sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt) || b.id - a.id);
    return { key, active: sorted[0], history: sorted.slice(1) };
  });
}

export type UploadDecision = { allowed: boolean; replace?: boolean; reason?: string };

/** Not submitted → upload; pending/approved → blocked; rejected → replace. */
export function uploadDecision(docs: VerificationDocument[], key: string): UploadDecision {
  const group = groupDocuments(docs).find((g) => g.key === key);
  if (!group) return { allowed: true, replace: false };
  if (group.active.status === "pending") return { allowed: false, reason: "This document is already pending review." };
  if (group.active.status === "approved") return { allowed: false, reason: "This document is already approved." };
  return { allowed: true, replace: true };
}

/** Applicable fixed documents. CAC applies only to registered businesses. */
export function applicableDocumentTypes(businessType: BusinessType): VerificationDocumentType[] {
  return businessType === "registered_business" ? ["id", "address_proof", "cac"] : ["id", "address_proof"];
}

/** Equal-weight proposal: each applicable document counts once, only when approved. */
export function documentationScore(docs: VerificationDocument[], businessType: BusinessType) {
  const groups = groupDocuments(docs);
  const items = applicableDocumentTypes(businessType).map((type) => ({
    type,
    status: groups.find((g) => g.key === type)?.active.status ?? ("not_submitted" as const),
  }));
  const approved = items.filter((i) => i.status === "approved").length;
  return {
    percent: Math.round((approved / items.length) * 100),
    approved,
    pending: items.filter((i) => i.status === "pending").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    total: items.length,
    items,
  };
}
