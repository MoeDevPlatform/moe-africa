import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersService, type ArtisanPayoutBundle } from "@/lib/apiServices";
import PaymentTermsSection from "./PaymentTermsSection";
import { summarisePayouts } from "@/lib/payoutSummary";

type Milestone = { id?: number; label?: string; name?: string; stage?: string; amount?: number; status?: string };

/** Read-only view of existing per-order payout records — no new ledger, no transfers. */
const ArtisanEarningsPanel = () => {
  const [bundles, setBundles] = useState<ArtisanPayoutBundle[]>([]);
  const [milestones, setMilestones] = useState<Array<{ orderId: number; items: Milestone[] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await ordersService.list({ pageSize: 100 });
        const ids = (res.data ?? []).map((o) => String(o.id));
        const payouts = await Promise.allSettled(ids.map((id) => ordersService.getArtisanPayout(id)));
        const ms = await Promise.allSettled(ids.map((id) => ordersService.getMilestones(id)));
        if (!alive) return;
        setBundles(payouts.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : [])));
        setMilestones(
          ms.flatMap((r, i) => {
            if (r.status !== "fulfilled") return [];
            const v = r.value as unknown;
            const items = (Array.isArray(v) ? v : Array.isArray((v as { data?: unknown })?.data) ? (v as { data: unknown[] }).data : []) as Milestone[];
            return items.length ? [{ orderId: Number(ids[i]), items }] : [];
          }),
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const s = summarisePayouts(bundles);
  const fmt = (n: number) => `${s.currency} ${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Verified earnings", s.verified],
          ["Pending payouts", s.pending],
          ["Initial material funding", s.materialFunding],
          ["Outstanding balance", s.outstanding],
        ].map(([label, value]) => (
          <Card key={label as string} className="shadow-none">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              {loading ? <Skeleton className="mt-1 h-7 w-24" /> : <p className="mt-1 text-2xl font-semibold">{fmt(value as number)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Intermediate and final milestones set by MOE for your orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-16" /> : milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {milestones.flatMap(({ orderId, items }) => items.map((m, i) => (
                <li key={`${orderId}-${m.id ?? i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <span>Order #{orderId} · {m.label ?? m.name ?? m.stage ?? `Milestone ${i + 1}`}</span>
                  <span className="flex items-center gap-2">
                    {typeof m.amount === "number" ? fmt(m.amount) : null}
                    {m.status ? <Badge variant="outline" className="capitalize">{m.status.replace(/_/g, " ")}</Badge> : null}
                  </span>
                </li>
              )))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Transfers MOE recorded to you. Payouts are made manually by MOE; nothing is sent automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-16" /> : s.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {s.history.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <span>Order #{t.orderId} · {new Date(t.transferDate).toLocaleDateString()} · Ref {t.externalReference}</span>
                  <span className="flex items-center gap-2">{t.currency} {t.amount.toLocaleString()}<Badge variant="outline" className="capitalize">{t.status}</Badge></span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank details</CardTitle>
          <CardDescription>
            Payout bank details aren't stored in your MOE account yet. MOE confirms the payee for each transfer; the payee name shows in your payment history.
          </CardDescription>
        </CardHeader>
      </Card>

      <PaymentTermsSection />
    </div>
  );
};

export default ArtisanEarningsPanel;
