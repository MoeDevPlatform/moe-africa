import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { customOrderService, type CustomOrderRecord } from "@/lib/apiServices";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

type RankRow = {
  artisanId: number;
  name?: string;
  brandName?: string | null;
  email?: string | null;
  isCustomOrderEligible?: boolean;
  compositeRank: number;
  fulfilmentRate?: number;
  satisfactionScore?: number;
  avgResponseTimeHrs?: number | null;
};

const CustomOrdersAdminPage = () => {
  const [rows, setRows] = useState<CustomOrderRecord[]>([]);
  const [ranks, setRanks] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranksLoading, setRanksLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    customOrderService
      .listAdmin({ pageSize: 50 })
      .then(setRows)
      .catch((e: Error) => toast.error(e.message || "Failed to load custom orders"))
      .finally(() => setLoading(false));
  };

  const loadRanks = () => {
    setRanksLoading(true);
    customOrderService
      .listAdminRanks({ pageSize: 50 })
      .then((res) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        setRanks(
          items.map((r) => ({
            artisanId: r.artisanId,
            name: (r as RankRow).name,
            brandName: r.brandName,
            email: (r as RankRow).email ?? null,
            isCustomOrderEligible: (r as RankRow).isCustomOrderEligible,
            compositeRank: r.compositeRank,
            fulfilmentRate: (r as RankRow).fulfilmentRate,
            satisfactionScore: (r as RankRow).satisfactionScore,
            avgResponseTimeHrs: (r as RankRow).avgResponseTimeHrs,
          })),
        );
      })
      .catch(() => setRanks([]))
      .finally(() => setRanksLoading(false));
  };

  useEffect(() => {
    loadOrders();
    loadRanks();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await customOrderService.recalculateAdminRanks();
      toast.success(
        res.status === "already_running"
          ? "Recalculation already running"
          : `Ranks recalculated (${res.processed ?? 0} artisans)`,
      );
      loadRanks();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Custom Orders</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Commission requests for eligible artisans. Eligibility is toggled on each artisan&apos;s
            detail page. Ranking below uses fulfilment, satisfaction, and response metrics — separate
            from eligibility.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Performance ranking</CardTitle>
              <CardDescription>
                Eligible artisans ordered by composite custom-order rank. Toggle eligibility under{" "}
                <Link to="/admin/artisans" className="underline text-primary">
                  Artisans
                </Link>
                .
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              disabled={recalculating}
              onClick={handleRecalculate}
            >
              {recalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Recalculate
            </Button>
          </CardHeader>
          <CardContent>
            {ranksLoading ? (
              <p className="text-sm text-muted-foreground">Loading ranks…</p>
            ) : ranks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No ranks yet. Recalculate after artisans have completed custom orders.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Artisan</th>
                      <th className="py-2 pr-3">Eligible</th>
                      <th className="py-2 pr-3">Composite</th>
                      <th className="py-2 pr-3">Fulfilment</th>
                      <th className="py-2">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranks.map((r, i) => (
                      <tr key={r.artisanId} className="border-b last:border-0">
                        <td className="py-2 pr-3 tabular-nums">{i + 1}</td>
                        <td className="py-2 pr-3">
                          <Link
                            to={`/admin/artisans/${r.artisanId}`}
                            className="font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {r.name || r.brandName || `Artisan #${r.artisanId}`}
                          </Link>
                          {r.email && (
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={r.isCustomOrderEligible ? "default" : "secondary"}>
                            {r.isCustomOrderEligible ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {Number(r.compositeRank).toFixed(2)}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {r.fulfilmentRate != null
                            ? `${Math.round(Number(r.fulfilmentRate) * 100)}%`
                            : "—"}
                        </td>
                        <td className="py-2 tabular-nums">
                          {r.satisfactionScore != null
                            ? Number(r.satisfactionScore).toFixed(2)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All requests</CardTitle>
            <CardDescription>Latest commission submissions across the marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom orders yet.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-3 border rounded-lg p-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium truncate">
                        {row.artisanName || `Artisan ${row.artisanId}`}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {row.description || "No description"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Customer: {row.customerName || row.customerId}
                        {row.budget != null ? ` · Budget ₦${row.budget.toLocaleString()}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {row.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CustomOrdersAdminPage;
