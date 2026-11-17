import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  adminOrdersService,
  ordersService,
} from "@/lib/apiServices";

type Row = {
  id: number;
  productName?: string | null;
  providerName?: string | null;
  status?: string;
  qualityReviewStatus?: string | null;
  countdown?: {
    productionDeadline?: string | null;
    productionOriginalDeadline?: string | null;
    msRemaining?: number | null;
    overdue?: boolean;
    productionDurationDays?: number | null;
  } | null;
  latestProgress?: { note: string; percentComplete: number | null; createdAt: string } | null;
};

const AdminProductionPanel = ({ initialOrderId }: { initialOrderId?: number | null }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(initialOrderId ?? null);
  const [quality, setQuality] = useState<Record<string, unknown> | null>(null);
  const [extendHours, setExtendHours] = useState("24");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminOrdersService
      .listProduction({ pageSize: 50 })
      .then((res) => setRows(((res as { data?: Row[] }).data ?? []) as Row[]))
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialOrderId) setSelectedId(initialOrderId);
  }, [initialOrderId]);

  useEffect(() => {
    if (!selectedId) {
      setQuality(null);
      return;
    }
    ordersService
      .getQuality(String(selectedId))
      .then((q) => setQuality(q as Record<string, unknown>))
      .catch(() => setQuality(null));
  }, [selectedId]);

  const extend = async () => {
    if (!selectedId || !reason.trim()) {
      toast.error("Reason required");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.extendProductionDeadline(selectedId, {
        extraHours: Number(extendHours),
        reason: reason.trim(),
      });
      toast.success("Deadline extended (original preserved)");
      setReason("");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Extend failed");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (
    submissionId: number,
    decision: "approve" | "request_rework" | "reject",
  ) => {
    if (!selectedId) return;
    if (decision !== "approve" && !reason.trim()) {
      toast.error("Reason required");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.decideQuality(selectedId, submissionId, {
        decision,
        reason: reason.trim() || undefined,
      });
      toast.success(
        decision === "approve"
          ? "Approved for delivery (no payout auto-released)"
          : decision,
      );
      setReason("");
      load();
      setQuality(
        (await ordersService.getQuality(String(selectedId))) as Record<string, unknown>,
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  };

  const submissions = (quality?.submissions as Array<{
    id: number;
    status: string;
    description: string;
    version: number;
  }>) ?? [];
  const latestSubmitted = [...submissions].reverse().find((s) => s.status === "submitted");

  return (
    <div className="space-y-4" data-testid="admin-production-panel">
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {rows.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">No active production orders.</Card>
            ) : (
              rows.map((row) => (
                <Card
                  key={row.id}
                  className={`p-3 cursor-pointer ${selectedId === row.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedId(row.id)}
                  data-testid={`admin-production-row-${row.id}`}
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{row.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        #{row.id} · {row.providerName}
                      </p>
                      {row.latestProgress ? (
                        <p className="text-xs mt-1 line-clamp-2">{row.latestProgress.note}</p>
                      ) : null}
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={row.countdown?.overdue ? "destructive" : "secondary"}>
                        {row.countdown?.overdue ? "Overdue" : "In production"}
                      </Badge>
                      {row.countdown?.productionDeadline ? (
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(row.countdown.productionDeadline).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className="p-4 space-y-4" data-testid="admin-production-detail">
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">Select an order.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold">Extend production deadline</h3>
                  <p className="text-xs text-muted-foreground">
                    Original deadline is preserved in audit history.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      className="w-24"
                      type="number"
                      value={extendHours}
                      onChange={(e) => setExtendHours(e.target.value)}
                      data-testid="admin-production-extend-hours"
                    />
                    <span className="text-xs">hours</span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void extend()}
                      data-testid="admin-production-extend"
                    >
                      Extend
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <h3 className="font-semibold">Quality review</h3>
                  {latestSubmitted ? (
                    <>
                      <p className="text-sm">v{latestSubmitted.version}: {latestSubmitted.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => void decide(latestSubmitted.id, "approve")}
                          data-testid="admin-quality-approve"
                        >
                          Approve for delivery
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void decide(latestSubmitted.id, "request_rework")}
                          data-testid="admin-quality-rework"
                        >
                          Request rework
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => void decide(latestSubmitted.id, "reject")}
                          data-testid="admin-quality-reject"
                        >
                          Reject
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No pending quality submission.</p>
                  )}
                </div>

                <Textarea
                  placeholder="Reason (required for extend / rework / reject)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="admin-production-reason"
                />
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminProductionPanel;
