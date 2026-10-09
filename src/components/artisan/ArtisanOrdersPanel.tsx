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
  type Order,
  type OrderStatusHistoryEntry,
} from "@/lib/apiServices";

const statusLabel = (s: string) => s.replace(/_/g, " ");

const ArtisanOrdersPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, OrderStatusHistoryEntry[]>>({});

  const load = useCallback(() => {
    setLoading(true);
    ordersService
      .list({ pageSize: 50 })
      .then((res) => setOrders(res.data ?? []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadHistory = async (orderId: string) => {
    try {
      const track = await ordersService.getTracking(orderId);
      setHistory((prev) => ({ ...prev, [orderId]: track.history ?? [] }));
    } catch {
      /* ignore */
    }
  };

  const handleStatusChange = async (order: Order, next: string) => {
    setUpdatingId(order.id);
    try {
      await ordersService.update(order.id, { status: next });
      toast.success(`Order marked ${statusLabel(next)}`);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No orders yet. Customer orders for your products will appear here.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
        const rows = history[order.id];
        return (
          <Card key={order.id} className="p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.productName}</p>
                <p className="text-xs text-muted-foreground">
                  #{order.orderNumber ?? order.id} · ₦{order.price.toLocaleString()}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {statusLabel(order.status)}
              </Badge>
            </div>

            {nextStatuses.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Update status:</span>
                <Select
                  disabled={updatingId === order.id}
                  onValueChange={(v) => handleStatusChange(order, v)}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Choose next status" />
                  </SelectTrigger>
                  <SelectContent>
                    {nextStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabel(s)}
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
                {(rows ?? order.statusHistory ?? []).map((h, i) => (
                  <div key={`${h.createdAt}-${i}`} className="text-sm">
                    <p className="font-medium capitalize">{statusLabel(h.status)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString()}
                      {h.note ? ` — ${h.note}` : ""}
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};

export default ArtisanOrdersPanel;
