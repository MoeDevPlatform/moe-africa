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

const statusLabel = (s: string) => s.replace(/_/g, " ");

const FILTERS: Array<{ id: ArtisanOrderView; label: string; hint: string }> = [
  { id: "all", label: "All", hint: "Every order assigned to you, including cancelled" },
  { id: "new", label: "New Orders", hint: "Newly placed orders awaiting confirmation (status: pending). These also appear under Pending Orders." },
  { id: "pending", label: "Pending Orders", hint: "Open orders, including newly placed pending orders and confirmed, in progress, ready, shipped, or approved work." },
  { id: "completed", label: "Completed Orders", hint: "Delivered orders (status: delivered)." },
];

type Props = {
  view?: ArtisanOrderView;
  onViewChange?: (view: ArtisanOrderView) => void;
  onOrdersChanged?: () => void;
};

const ArtisanOrdersPanel = ({ view = "all", onViewChange, onOrdersChanged }: Props) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<ArtisanOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, OrderStatusHistoryEntry[]>>({});

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
            const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
            const rows = history[order.id];
            return (
              <Card key={order.id} className="p-4 space-y-3" data-testid={`artisan-order-${order.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      #{order.orderNumber ?? order.id} · ₦{order.price.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize" data-testid="artisan-order-status">
                    {statusLabel(order.status)}
                  </Badge>
                </div>

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
    </div>
  );
};

export default ArtisanOrdersPanel;
