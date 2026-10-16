import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminService,
  type AdminEventsSummary,
  type AdminEventsSummaryRow,
} from "@/lib/apiServices";
import { toast } from "sonner";
import { Activity, Eye, RefreshCw, Search, ShoppingCart, Heart } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  product_view: "Product views",
  artisan_view: "Artisan profile views",
  search: "Searches",
  add_to_cart: "Add to cart",
  wishlist_add: "Wishlist adds",
  category_browse: "Category browse",
  filter_applied: "Filters applied",
};

function labelFor(eventType: string) {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

function entityLink(row: AdminEventsSummaryRow) {
  if (!row.entityId) return null;
  if (row.eventType === "product_view" || row.entityType === "product") {
    return {
      href: `/admin/products/${row.entityId}`,
      publicHref: `/marketplace/product/${row.entityId}`,
      label: `Product #${row.entityId}`,
    };
  }
  if (row.eventType === "artisan_view" || row.entityType === "artisan") {
    return {
      href: `/admin/artisans/${row.entityId}`,
      publicHref: `/marketplace/provider/${row.entityId}`,
      label: `Artisan #${row.entityId}`,
    };
  }
  return null;
}

const BehaviourPage = () => {
  const [summary, setSummary] = useState<AdminEventsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"24h" | "7d">("24h");

  const load = () => {
    setLoading(true);
    adminService
      .eventsSummary()
      .then(setSummary)
      .catch((err) => toast.error(err?.message || "Failed to load behaviour data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const entityRows = period === "24h" ? summary?.last24h ?? [] : summary?.last7d ?? [];
  const byType =
    period === "24h"
      ? summary?.byEventType?.last24h
      : summary?.byEventType?.last7d;
  const totalEvents =
    period === "24h" ? summary?.totals?.last24h : summary?.totals?.last7d;

  const typeTotals = useMemo(() => {
    if (byType?.length) return byType;
    // Fallback when older BE only returns entity rows
    const map = new Map<string, number>();
    for (const row of entityRows) {
      map.set(row.eventType, (map.get(row.eventType) ?? 0) + row.count);
    }
    return [...map.entries()]
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count);
  }, [byType, entityRows]);

  const productViews = entityRows
    .filter((r) => r.eventType === "product_view")
    .slice(0, 15);
  const artisanViews = entityRows
    .filter((r) => r.eventType === "artisan_view")
    .slice(0, 15);

  const fallbackTotal = typeTotals.reduce((s, r) => s + r.count, 0);
  const displayTotal = totalEvents ?? fallbackTotal;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Activity className="h-7 w-7 text-accent" />
              Behaviour & recommendations
            </h1>
            <p className="mt-1 text-muted-foreground max-w-2xl">
              Real marketplace signals captured from customer browsing (views, search, cart,
              wishlist). These records feed demand badges and recommendation insights — not
              fabricated analytics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-border overflow-hidden">
              <Button
                type="button"
                variant={period === "24h" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setPeriod("24h")}
              >
                Last 24h
              </Button>
              <Button
                type="button"
                variant={period === "7d" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setPeriod("7d")}
              >
                Last 7 days
              </Button>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total events ({period})</CardDescription>
              <CardTitle className="text-3xl font-display">
                {loading ? "—" : displayTotal.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          {(["product_view", "artisan_view", "search", "add_to_cart"] as const).map((key) => {
            const row = typeTotals.find((t) => t.eventType === key);
            const Icon =
              key === "product_view" || key === "artisan_view"
                ? Eye
                : key === "search"
                  ? Search
                  : key === "add_to_cart"
                    ? ShoppingCart
                    : Heart;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {labelFor(key)}
                  </CardDescription>
                  <CardTitle className="text-3xl font-display">
                    {loading ? "—" : (row?.count ?? 0).toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Events by type</CardTitle>
            <CardDescription>
              All persisted behaviour event types in the selected window. Client dedupes the same
              session + event + entity within 5 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : typeTotals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events yet. Browse the marketplace (product pages, search, cart) to generate
                signals.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {typeTotals.map((t) => (
                  <Badge key={t.eventType} variant="secondary" className="text-sm py-1.5 px-3">
                    {labelFor(t.eventType)}
                    <span className="ml-2 font-mono tabular-nums">{t.count}</span>
                  </Badge>
                ))}
              </div>
            )}
            {summary?.trackedEventTypes && (
              <p className="text-xs text-muted-foreground mt-4">
                Tracked by the storefront: {summary.trackedEventTypes.map(labelFor).join(" · ")}
              </p>
            )}
            {summary?.demandThresholds && (
              <p className="text-xs text-muted-foreground mt-1">
                High-demand badge: &gt;{summary.demandThresholds.viewsTodayHigh} views today or &gt;
                {summary.demandThresholds.viewsWeekHigh} this week. Soft “viewed today” badge from{" "}
                {summary.demandThresholds.viewsTodayShowBadge}+ views today.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top products by views</CardTitle>
              <CardDescription>Counted product_view events ({period})</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : productViews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No product views in this window.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productViews.map((row) => {
                      const link = entityLink(row);
                      return (
                        <TableRow key={`${row.eventType}-${row.entityId}`}>
                          <TableCell>
                            {link ? (
                              <div className="space-y-0.5">
                                <Link
                                  to={link.href}
                                  className="font-medium text-primary underline-offset-2 hover:underline"
                                >
                                  {link.label}
                                </Link>
                                <a
                                  href={link.publicHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-xs text-muted-foreground hover:underline"
                                >
                                  View on marketplace
                                </a>
                              </div>
                            ) : (
                              row.entityId
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {row.count}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top artisans by profile views</CardTitle>
              <CardDescription>Counted artisan_view events ({period})</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : artisanViews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No artisan views in this window.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artisan</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artisanViews.map((row) => {
                      const link = entityLink(row);
                      return (
                        <TableRow key={`${row.eventType}-${row.entityId}`}>
                          <TableCell>
                            {link ? (
                              <div className="space-y-0.5">
                                <Link
                                  to={link.href}
                                  className="font-medium text-primary underline-offset-2 hover:underline"
                                >
                                  {link.label}
                                </Link>
                                <a
                                  href={link.publicHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-xs text-muted-foreground hover:underline"
                                >
                                  View on marketplace
                                </a>
                              </div>
                            ) : (
                              row.entityId
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {row.count}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BehaviourPage;
