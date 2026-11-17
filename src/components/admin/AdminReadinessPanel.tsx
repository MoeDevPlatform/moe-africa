import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  adminOrdersService,
  ordersService,
  type OrderReadinessBundle,
  type OrderReadinessSummary,
} from "@/lib/apiServices";

const FILTERS = [
  { id: "all", label: "All readiness" },
  { id: "awaiting_response", label: "Awaiting Artisan Response" },
  { id: "overdue", label: "Response Overdue" },
  { id: "submitted", label: "Readiness Submitted" },
  { id: "under_review", label: "Under Review" },
  { id: "changes_requested", label: "Changes Requested" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "cannot_fulfil", label: "Cannot Fulfil" },
] as const;

type Row = {
  id: number;
  productName: string;
  providerName?: string;
  customerId?: number;
  price?: number;
  currency?: string;
  readiness?: OrderReadinessSummary | null;
  latestAssessment?: { id: number; version: number; status: string } | null;
  createdAt?: string;
};

const AdminReadinessPanel = ({ initialOrderId }: { initialOrderId?: number | null }) => {
  const [filter, setFilter] = useState<string>("submitted");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(initialOrderId ?? null);
  const [bundle, setBundle] = useState<OrderReadinessBundle | null>(null);
  const [reason, setReason] = useState("");
  const [extendHours, setExtendHours] = useState("6");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminOrdersService
      .listReadiness({ filter: filter === "all" ? undefined : filter, pageSize: 50 })
      .then((res) => setRows((res.data as Row[]) ?? []))
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialOrderId) setSelectedId(initialOrderId);
  }, [initialOrderId]);

  useEffect(() => {
    if (!selectedId) {
      setBundle(null);
      return;
    }
    ordersService
      .getReadiness(String(selectedId))
      .then(setBundle)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load assessment"));
  }, [selectedId]);

  const latestSubmitted = bundle?.assessments
    ?.slice()
    .reverse()
    .find((a) => a.status === "submitted");

  const decide = async (decision: "approve" | "request_changes" | "reject") => {
    if (!selectedId || !latestSubmitted) return;
    if ((decision === "request_changes" || decision === "reject") && !reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.decideReadiness(selectedId, latestSubmitted.id, {
        decision,
        reason: reason.trim() || undefined,
      });
      toast.success(
        decision === "approve"
          ? "Approved — awaiting initial payout (no production/payout triggered)"
          : decision === "request_changes"
            ? "Changes requested"
            : "Assessment rejected",
      );
      setReason("");
      load();
      const refreshed = await ordersService.getReadiness(String(selectedId));
      setBundle(refreshed);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  };

  const extend = async () => {
    if (!selectedId) return;
    const hours = Number(extendHours);
    if (!reason.trim()) {
      toast.error("Extension reason is required");
      return;
    }
    setBusy(true);
    try {
      const res = await adminOrdersService.extendReadinessDeadline(selectedId, {
        extraHours: hours,
        reason: reason.trim(),
      });
      toast.success(
        `Deadline extended by ${hours}h (no automatic penalty). New deadline: ${res.responseDeadline ?? "updated"}`,
      );
      setReason("");
      load();
      setBundle(await ordersService.getReadiness(String(selectedId)));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Extension failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="admin-readiness-panel">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
            data-testid={`admin-readiness-filter-${f.id}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3" data-testid="admin-readiness-list">
            {rows.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">No orders match this filter.</Card>
            ) : (
              rows.map((row) => (
                <Card
                  key={row.id}
                  className={`p-3 cursor-pointer ${selectedId === row.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedId(row.id)}
                  data-testid={`admin-readiness-row-${row.id}`}
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{row.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        #{row.id} · {row.providerName}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize h-fit">
                      {(row.readiness?.workflowStatus ?? "—").replace(/_/g, " ")}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className="p-4 space-y-4" data-testid="admin-readiness-detail">
            {!selectedId || !bundle ? (
              <p className="text-sm text-muted-foreground">Select an order to review readiness.</p>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold">Customer requirements</h3>
                  <p className="text-sm">{bundle.customerRequirements.productName}</p>
                  <pre className="text-xs mt-2 whitespace-pre-wrap bg-muted rounded p-2 overflow-x-auto">
                    {JSON.stringify(bundle.customerRequirements.customisationData ?? {}, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold">Assessments & history</h3>
                  <div className="space-y-3 mt-2 max-h-64 overflow-y-auto">
                    {bundle.assessments.map((a) => (
                      <div key={a.id} className="border rounded p-2 text-sm space-y-1">
                        <p className="font-medium">
                          v{a.version} · {a.type} · {a.status}
                        </p>
                        {a.cannotFulfil ? (
                          <p className="text-destructive text-xs">Cannot fulfil: {a.cannotFulfilReason}</p>
                        ) : (
                          <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(a.payload, null, 2)}
                          </pre>
                        )}
                        {a.evidence?.length ? (
                          <ul className="text-xs">
                            {a.evidence.map((e) => (
                              <li key={e.id}>
                                <a className="underline" href={e.url} target="_blank" rel="noreferrer">
                                  {e.kind}: {e.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {a.reviews?.map((r) => (
                          <p key={r.id} className="text-xs text-muted-foreground">
                            Review {r.decision} by #{r.reviewerId}: {r.reason || "—"} (
                            {new Date(r.createdAt).toLocaleString()})
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason (required for changes / reject / extension)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    data-testid="admin-readiness-reason"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busy || !latestSubmitted}
                      onClick={() => void decide("approve")}
                      data-testid="admin-readiness-approve"
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy || !latestSubmitted}
                      onClick={() => void decide("request_changes")}
                      data-testid="admin-readiness-changes"
                    >
                      Request Changes
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={busy || !latestSubmitted}
                      onClick={() => void decide("reject")}
                      data-testid="admin-readiness-reject"
                    >
                      Reject
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                    <Input
                      className="w-24"
                      type="number"
                      min={1}
                      max={168}
                      value={extendHours}
                      onChange={(e) => setExtendHours(e.target.value)}
                      data-testid="admin-readiness-extend-hours"
                    />
                    <span className="text-xs text-muted-foreground">hours</span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void extend()}
                      data-testid="admin-readiness-extend"
                    >
                      Record extension (no auto penalty)
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReadinessPanel;
