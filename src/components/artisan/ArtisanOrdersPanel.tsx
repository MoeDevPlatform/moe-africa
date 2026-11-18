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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  {
    id: "completed",
    label: "Completed Orders",
    hint: "Quality-approved orders in fulfillment (ready, dispatched, delivered).",
  },
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

function productionRemaining(deadlineIso: string | null | undefined) {
  if (!deadlineIso) return null;
  return formatRemaining(new Date(deadlineIso).getTime() - Date.now());
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
  const [progressNote, setProgressNote] = useState<Record<string, string>>({});
  const [progressFiles, setProgressFiles] = useState<Record<string, File[]>>({});
  const [qualityDesc, setQualityDesc] = useState<Record<string, string>>({});
  const [qualityFiles, setQualityFiles] = useState<Record<string, File[]>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

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

  const handleStartWork = async (order: Order) => {
    setUpdatingId(order.id);
    try {
      const res = await ordersService.startWork(order.id);
      toast.success(
        res.alreadyStarted
          ? "Production already started"
          : `Work started · deadline ${res.productionDeadline ? new Date(res.productionDeadline).toLocaleString() : "set"}`,
      );
      onViewChange?.("pending");
      load();
      onOrdersChanged?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Start Work failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProgress = async (order: Order) => {
    const note = (progressNote[order.id] || "").trim();
    if (!note) {
      toast.error("Progress note is required");
      return;
    }
    setUpdatingId(order.id);
    try {
      await ordersService.submitProductionProgress(
        order.id,
        { note },
        progressFiles[order.id] ?? [],
      );
      toast.success("Progress submitted");
      setProgressNote((p) => ({ ...p, [order.id]: "" }));
      setProgressFiles((p) => ({ ...p, [order.id]: [] }));
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Progress failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQualitySubmit = async (order: Order) => {
    const description = (qualityDesc[order.id] || "").trim();
    const files = qualityFiles[order.id] ?? [];
    if (!description) {
      toast.error("Describe the completed work");
      return;
    }
    if (!files.some((f) => f.type.startsWith("image/"))) {
      toast.error("At least one final product photo is required");
      return;
    }
    setUpdatingId(order.id);
    try {
      await ordersService.submitQuality(
        order.id,
        { description, specsConfirmed: true },
        files,
      );
      toast.success("Submitted for quality review");
      load();
      onOrdersChanged?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Quality submit failed");
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
            void tick;
            const prodRemaining =
              order.production?.msRemaining != null
                ? formatRemaining(order.production.msRemaining - (tick > 0 ? 0 : 0))
                : productionRemaining(order.production?.productionDeadline);
            const liveRemaining = order.production?.productionDeadline
              ? formatRemaining(
                  new Date(order.production.productionDeadline).getTime() - Date.now(),
                )
              : prodRemaining;
            const productionLabel = order.production?.displayLabel;
            const readyToStart = !!order.production?.readyToStart;
            const inProduction =
              !!order.production?.productionStartedAt &&
              order.status === "in_progress" &&
              order.production?.qualityReviewStatus !== "submitted" &&
              order.production?.qualityReviewStatus !== "approved";
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
                        {productionLabel
                          ? productionLabel
                          : statusLabel(order.readiness.workflowStatus)}
                      </Badge>
                    ) : null}
                    {remaining && !order.production?.productionStartedAt ? (
                      <p className="text-xs text-muted-foreground" data-testid="artisan-readiness-deadline">
                        {remaining}
                      </p>
                    ) : null}
                    {order.production?.productionDeadline ? (
                      <p
                        className={`text-xs ${order.production.overdue ? "text-destructive" : "text-muted-foreground"}`}
                        data-testid="artisan-production-countdown"
                      >
                        Due {new Date(order.production.productionDeadline).toLocaleString()}
                        {liveRemaining ? ` · ${liveRemaining}` : ""}
                        {order.production.productionDurationDays
                          ? ` · ${order.production.productionDurationDays}d planned`
                          : ""}
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

                {order.production?.awaitingInitialPayout ? (
                  <p className="text-xs text-muted-foreground" data-testid="artisan-awaiting-payout">
                    Approved — Awaiting Initial Payout. Start Work unlocks after verified funding.
                  </p>
                ) : null}

                {readyToStart ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={updatingId === order.id}
                    data-testid={`artisan-start-work-${order.id}`}
                    onClick={() => void handleStartWork(order)}
                  >
                    {updatingId === order.id ? "Starting…" : "Start Work"}
                  </Button>
                ) : null}

                {inProduction ? (
                  <div className="space-y-2 rounded border p-3" data-testid={`artisan-production-panel-${order.id}`}>
                    <p className="text-sm font-medium">Production progress</p>
                    <Textarea
                      placeholder="Progress note"
                      value={progressNote[order.id] ?? ""}
                      onChange={(e) =>
                        setProgressNote((p) => ({ ...p, [order.id]: e.target.value }))
                      }
                      data-testid={`artisan-progress-note-${order.id}`}
                    />
                    <Input
                      type="file"
                      multiple
                      accept="image/*,audio/*,.pdf,.doc,.docx"
                      onChange={(e) =>
                        setProgressFiles((p) => ({
                          ...p,
                          [order.id]: Array.from(e.target.files ?? []),
                        }))
                      }
                      data-testid={`artisan-progress-files-${order.id}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={updatingId === order.id}
                      onClick={() => void handleProgress(order)}
                      data-testid={`artisan-production-progress-submit-${order.id}`}
                    >
                      Submit progress
                    </Button>
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-medium">Submit for Quality Review</p>
                      <Textarea
                        placeholder="Description of completed work"
                        value={qualityDesc[order.id] ?? ""}
                        onChange={(e) =>
                          setQualityDesc((p) => ({ ...p, [order.id]: e.target.value }))
                        }
                        data-testid={`artisan-quality-description-${order.id}`}
                      />
                      <Input
                        type="file"
                        multiple
                        accept="image/*,audio/*,.pdf"
                        onChange={(e) =>
                          setQualityFiles((p) => ({
                            ...p,
                            [order.id]: Array.from(e.target.files ?? []),
                          }))
                        }
                        data-testid={`artisan-quality-files-${order.id}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={updatingId === order.id}
                        onClick={() => void handleQualitySubmit(order)}
                        data-testid={`artisan-quality-submit-${order.id}`}
                      >
                        Submit for Quality Review
                      </Button>
                    </div>
                  </div>
                ) : null}

                {order.production?.fulfillmentStatus ? (
                  <p className="text-xs text-muted-foreground" data-testid={`artisan-fulfillment-${order.id}`}>
                    Fulfillment: {statusLabel(order.production.fulfillmentStatus)}
                  </p>
                ) : null}

                {view === "completed" &&
                (order.production?.customerRating != null || order.customerRating != null) ? (
                  <div
                    className="text-sm space-y-1"
                    data-testid={`artisan-order-review-${order.id}`}
                  >
                    <p className="font-medium">
                      Customer rating:{" "}
                      {"★".repeat(order.production?.customerRating ?? order.customerRating ?? 0)}
                      {"☆".repeat(
                        5 - (order.production?.customerRating ?? order.customerRating ?? 0),
                      )}
                    </p>
                    {(order.production?.customerReview ?? order.customerReview) ? (
                      <p className="text-muted-foreground text-xs">
                        {order.production?.customerReview ?? order.customerReview}
                      </p>
                    ) : null}
                  </div>
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
