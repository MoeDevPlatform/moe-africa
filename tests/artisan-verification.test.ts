import { describe, expect, test } from "bun:test";
import { documentKey, documentationScore, groupDocuments, uploadDecision } from "../src/lib/verificationRules";
import { profileCompletion } from "../src/lib/profileCompletion";
import { summarisePayouts } from "../src/lib/payoutSummary";
import type { VerificationDocument } from "../src/lib/apiServices";

const doc = (id: number, type: VerificationDocument["type"], status: VerificationDocument["status"], at: string, documentName?: string): VerificationDocument =>
  ({ id, type, status, uploadedAt: at, documentName });

describe("upload rules", () => {
  test("not submitted → upload allowed", () => expect(uploadDecision([], "cac")).toEqual({ allowed: true, replace: false }));
  test("pending → blocked", () => expect(uploadDecision([doc(1, "cac", "pending", "2026-01-01")], "cac").allowed).toBe(false));
  test("approved → blocked", () => expect(uploadDecision([doc(1, "id", "approved", "2026-01-01")], "id").allowed).toBe(false));
  test("rejected → replace allowed", () => expect(uploadDecision([doc(1, "id", "rejected", "2026-01-01")], "id")).toEqual({ allowed: true, replace: true }));
  test("replacement becomes active and pending; rejected kept in history", () => {
    const g = groupDocuments([doc(1, "id", "rejected", "2026-01-01"), doc(2, "id", "pending", "2026-02-01")])[0];
    expect(g.active.id).toBe(2);
    expect(g.active.status).toBe("pending");
    expect(g.history.map((d) => d.id)).toEqual([1]);
  });
  test("same record returned twice shows once", () => expect(groupDocuments([doc(5, "cac", "pending", "2026-01-01"), doc(5, "cac", "pending", "2026-01-01")])).toHaveLength(1));
  test("named other documents are independent", () => {
    const docs = [doc(1, "other", "pending", "2026-01-01", "Trade licence")];
    expect(uploadDecision(docs, documentKey("other", "Trade licence")).allowed).toBe(false);
    expect(uploadDecision(docs, documentKey("other", "Guild certificate")).allowed).toBe(true);
    expect(groupDocuments([...docs, doc(2, "other", "pending", "2026-01-02", "Guild certificate")])).toHaveLength(2);
  });
});

describe("documentation score", () => {
  test("individual: CAC not required", () => {
    const s = documentationScore([doc(1, "id", "approved", "x"), doc(2, "address_proof", "approved", "x")], "individual");
    expect(s.percent).toBe(100);
    expect(s.total).toBe(2);
  });
  test("registered business: CAC required, equal weight", () =>
    expect(documentationScore([doc(1, "id", "approved", "x")], "registered_business").percent).toBe(33));
  test("pending and rejected never count as approved", () => {
    const s = documentationScore([doc(1, "id", "rejected", "x"), doc(2, "address_proof", "pending", "x")], "individual");
    expect(s.percent).toBe(0);
    expect(s.pending).toBe(1);
    expect(s.rejected).toBe(1);
  });
});

describe("profile completion is independent", () => {
  test("full profile is 100% regardless of documents", () =>
    expect(profileCompletion({ businessName: "A", storeImageUrl: "u", coverImageUrl: "u", description: "d", city: "c", state: "s", country: "NG", email: "e", serviceCategories: ["tailoring"], productCount: 1 }).percent).toBe(100));
  test("missing items are listed", () => expect(profileCompletion({ businessName: "A" }).missing).toContain("Cover image"));
});

describe("payout summary reuses records", () => {
  test("verified, pending and outstanding", () => {
    const bundle = { orderId: 7, payout: { status: "recorded", currency: "NGN", approvedAmount: 1000, fundingRequired: true, verifiedTotal: 400,
      transfers: [{ id: 1, amount: 400, status: "verified", transferDate: "2026-01-01" }, { id: 2, amount: 100, status: "recorded", transferDate: "2026-01-02" }] } } as never;
    const s = summarisePayouts([bundle]);
    expect([s.verified, s.pending, s.materialFunding, s.outstanding]).toEqual([400, 100, 1000, 500]);
    expect(s.history.map((t) => t.id)).toEqual([2, 1]);
  });
});
