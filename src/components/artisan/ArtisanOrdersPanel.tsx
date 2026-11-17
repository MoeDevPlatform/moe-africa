import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ORDER_STATUS_TRANSITIONS,
  ordersService,
  type ArtisanOrderSummary,
  type ArtisanOrderView,
  type Order,
  type OrderStatusHistoryEntry,
} from "@/lib/apiServices";
import ReadinessAssessmentDialog from "@/components/artisan/ReadinessAssessmentDialog";

const statusLabel = (s: string) => s.replace(/_/g, " ");

const FILTERS: Array<{ id: ArtisanOrderView; label: string; hint: string }> = [
  { id: "all", label: "All", hint: "Every order assigned to you, including cancelled" },
  {
    id: "new",
    label: "New Orders",
    hint: "Assigned orders in the readiness intake queue (awaiting response through approved — awaiting payout), plus legacy pending orders.",
  },
  {
    id: "pending",
    label: "Pending Orders",
    hint: "Open orders, including newly placed pending orders and confirmed, in progress, ready, shipped, or approved work.",
  },
  { id: "completed", label: "Completed Orders", hint: "Delivered orders (status: delivered)." },
];

function formatRemaining(ms: number | null | undefined) {
  if (ms == null) return null;
  if (ms <= 0) return "Overdue";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  return `${hours}h ${mins}m left`;
}

type Props = {
  view?: ArtisanOrderView;
  onViewChange?: (view: ArtisanOrderView) => void;
  onOrdersChanged?: () => void;
  initialReadinessOrderId?: string | null;
};

const ArtisanOrdersPanel = ({
  view = "all",
  onViewChange,
  onOrdersChanged,
  initialReadinessOrderId,
}: Props) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<ArtisanOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, OrderStatusHistoryEntry[]>>({});
  const [readinessOrder, setReadinessOrder] = useState<Order | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ordersService
      .list({ pageSize: 100, view })
      .then((res) => {
        setOrders(res.data ?? []);
        setSummary(res.summary ?? null);
      })
      .catch((e: unknown) => {
        setOrders([]);
        setError(e instanceof Error ? e.message : "Failed to load orders");
      })
      .finally(() => setLoading(false));
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!initialReadinessOrderId || orders.length === 0) return;
    const match = orders.find((o) => o.id === String(initialReadinessOrderId));
    if (match) setReadinessOrder(match);
  }, [initialReadinessOrderId, orders]);

  const loadHistory = async (orderId: string) => {
    try {
      const track = await ordersService.getTracking(orderId);
      setHistory((prev) => ({ ...prev, [orderId]: track.history ?? [] }));
    } catch {
      /* history is optional */
    }
  };

  const handleStatusChange = async (order: Order, next: string) => {
    setUpdatingId(order.id);
    try {
      await ordersService.updateStatus(order.id, next);
      toast.success(`Order marked ${statusLabel(next)}`);
      load();
      onOrdersChanged?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const countFor = (id: ArtisanOrderView) => {
    if (!summary) return null;
    return id === "all" ? summary.all : summary[id];
  };

  const canSubmitReadiness = (order: Order) => {
    const status = order.readiness?.workflowStatus;
    return (
      !!status &&
      ["awaiting_response", "overdue", "changes_requested"].includes(status)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" data-testid="artisan-order-filters">
        {FILTERS.map((filter) => {
          const active = view === filter.id;
          const count = countFor(filter.id);
          return (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              title={filter.hint}
              data-testid={`artisan-order-filter-${filter.id}`}
              onClick={() => onViewChange?.(filter.id)}
            >
              {filter.label}
              {count != null ? ` (${count})` : ""}
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {FILTERS.find((filter) => filter.id === view)?.hint}
      </p>

      {loading ? (
        <Skeleton className="h-48 w-full" data-testid="artisan-orders-loading" />
      ) : error ? (
        <Card className="p-8 text-center" data-testid="artisan-orders-error">
          <p className="text-destructive">{error}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={load}>
            Retry
          </Button>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground" data-testid="artisan-orders-empty">
          {view === "all"
            ? "No orders yet. Customer orders for your products will appear here."
            : "No orders match this filter."}
        </Card>
      ) : (
        <div className="space-y-4" data-testid="artisan-orders-list">
          {orders.map((order) => {
            const nextStatuses = (ORDER_STATUS_TRANSITIONS[order.status] ?? []).filter(
              (status) => !(order.readiness && status === "in_progress"),
            );
            const rows = history[order.id];
            const remaining = formatRemaining(order.readiness?.msRemaining ?? null);
            return (
              <Card key={order.id} className="p-4 space-y-3" data-testid={`artisan-order-${order.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{order.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      #{order.orderNumber ?? order.id} · {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm">
                      ₦{order.price.toLocaleString()}
                      {order.estimatedDelivery ? ` · Delivery: ${order.estimatedDelivery}` : ""}
                      {order.rushOrder ? " · Rush" : ""}
                    </p>
                    {order.customisationData ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Specs: {JSON.stringify(order.customisationData)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="capitalize" data-testid="artisan-order-status">
                      {statusLabel(order.status)}
                    </Badge>
                    {order.readiness ? (
                      <Badge
                        variant={
                          order.readiness.workflowStatus === "overdue" ? "destructive" : "secondary"
                        }
                        className="capitalize"
                        data-testid="artisan-readiness-status"
                      >
                        {statusLabel(order.readiness.workflowStatus)}
                      </Badge>
                    ) : null}
                    {remaining ? (
                      <p className="text-xs text-muted-foreground" data-testid="artisan-readiness-deadline">
                        {remaining}
                      </p>
                    ) : null}
                  </div>
                </div>

                {canSubmitReadiness(order) ? (
                  <Button
                    type="button"
                    size="sm"
                    data-testid={`artisan-readiness-accept-${order.id}`}
                    onClick={() => setReadinessOrder(order)}
                  >
                    Accept & Submit Readiness
                  </Button>
                ) : null}

                {order.readiness?.workflowStatus === "approved" ? (
                  <p className="text-xs text-muted-foreground">
                    Approved — awaiting initial payout. Production start is not available in Phase 1.
                  </p>
                ) : null}

                {nextStatuses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Update status:</span>
                    <Select
                      disabled={updatingId === order.id}
                      onValueChange={(value) => handleStatusChange(order, value)}
                    >
                      <SelectTrigger className="w-[180px] h-9" data-testid={`artisan-order-next-${order.id}`}>
                        <SelectValue placeholder="Choose next status" />
                      </SelectTrigger>
                      <SelectContent>
                        {nextStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updatingId === order.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                )}

                <Collapsible onOpenChange={(open) => open && !rows && loadHistory(order.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 px-0">
                      <ChevronDown className="h-4 w-4" />
                      Status history
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2 border-l-2 border-muted ml-2 pl-3">
                    {(rows ?? order.statusHistory ?? []).map((entry, index) => (
                      <div key={`${entry.createdAt}-${index}`} className="text-sm">
                        <p className="font-medium capitalize">{statusLabel(entry.status)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                          {entry.note ? ` — ${entry.note}` : ""}
                        </p>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      <ReadinessAssessmentDialog
        order={readinessOrder}
        open={!!readinessOrder}
        onOpenChange={(open) => {
          if (!open) setReadinessOrder(null);
        }}
        onSubmitted={() => {
          load();
          onOrdersChanged?.();
        }}
      />
    </div>
  );
};

export default ArtisanOrdersPanel;
