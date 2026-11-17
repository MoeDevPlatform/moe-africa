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
  type ArtisanPayoutBundle,
  type OrderProductionSummary,
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
  production?: OrderProductionSummary | null;
  latestAssessment?: { id: number; version: number; status: string } | null;
  createdAt?: string;
};

const AdminReadinessPanel = ({ initialOrderId }: { initialOrderId?: number | null }) => {
  const [filter, setFilter] = useState<string>("submitted");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(initialOrderId ?? null);
  const [bundle, setBundle] = useState<OrderReadinessBundle | null>(null);
  const [payout, setPayout] = useState<ArtisanPayoutBundle | null>(null);
  const [reason, setReason] = useState("");
  const [extendHours, setExtendHours] = useState("6");
  const [busy, setBusy] = useState(false);

  const [approvedAmount, setApprovedAmount] = useState("");
  const [exceptionApproved, setExceptionApproved] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payeeName, setPayeeName] = useState("");
  const [payeeDetails, setPayeeDetails] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [transferFiles, setTransferFiles] = useState<File[]>([]);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifyFiles, setVerifyFiles] = useState<File[]>([]);
  const [notRequiredReason, setNotRequiredReason] = useState("");
  const [disputeNotes, setDisputeNotes] = useState("");

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

  const refreshDetail = useCallback(async (orderId: number) => {
    const [readiness, payoutBundle] = await Promise.all([
      ordersService.getReadiness(String(orderId)),
      ordersService.getArtisanPayout(String(orderId)).catch(() => null),
    ]);
    setBundle(readiness);
    setPayout(payoutBundle);
    if (payoutBundle?.payout?.requestedAmount != null && !approvedAmount) {
      setApprovedAmount(String(payoutBundle.payout.requestedAmount));
    }
  }, [approvedAmount]);

  useEffect(() => {
    if (!selectedId) {
      setBundle(null);
      setPayout(null);
      return;
    }
    refreshDetail(selectedId).catch((e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to load assessment"),
    );
  }, [selectedId, refreshDetail]);

  const latestSubmitted = bundle?.assessments
    ?.slice()
    .reverse()
    .find((a) => a.status === "submitted");

  const latestApproved = bundle?.assessments
    ?.slice()
    .reverse()
    .find((a) => a.status === "approved");

  const materialCost =
    latestApproved?.payload &&
    typeof (latestApproved.payload as { estimatedMaterialCost?: unknown }).estimatedMaterialCost ===
      "number"
      ? (latestApproved.payload as { estimatedMaterialCost: number }).estimatedMaterialCost
      : payout?.payout?.requestedAmount ?? null;

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
          ? "Approved — awaiting initial payout approval"
          : decision === "request_changes"
            ? "Changes requested"
            : "Assessment rejected",
      );
      setReason("");
      load();
      await refreshDetail(selectedId);
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
      await refreshDetail(selectedId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Extension failed");
    } finally {
      setBusy(false);
    }
  };

  const approveAmount = async () => {
    if (!selectedId) return;
    const amount = Number(approvedAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid approved amount");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.approvePayoutAmount(selectedId, {
        approvedAmount: amount,
        currency: bundle?.customerRequirements.currency,
        reason: reason.trim() || undefined,
        exceptionApproved: exceptionApproved || undefined,
        exceptionReason: exceptionReason.trim() || undefined,
      });
      toast.success("Initial payout amount approved");
      load();
      await refreshDetail(selectedId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Amount approval failed");
    } finally {
      setBusy(false);
    }
  };

  const markNotRequired = async () => {
    if (!selectedId || !notRequiredReason.trim()) {
      toast.error("Reason required for non-production funding path");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.markPayoutNotRequired(selectedId, {
        reason: notRequiredReason.trim(),
      });
      toast.success("Marked funding not required (audited)");
      load();
      await refreshDetail(selectedId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const recordTransfer = async () => {
    if (!selectedId) return;
    const amount = Number(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !payeeName.trim() || !externalRef.trim()) {
      toast.error("Amount, payee, and external reference are required");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.recordPayoutTransfer(
        selectedId,
        {
          amount,
          currency: payout?.payout?.currency || bundle?.customerRequirements.currency,
          transferDate: new Date(transferDate).toISOString(),
          payeeName: payeeName.trim(),
          payeeDetails: payeeDetails.trim() || undefined,
          externalReference: externalRef.trim(),
        },
        transferFiles,
      );
      toast.success("Transfer recorded — pending independent verification");
      setExternalRef("");
      setTransferFiles([]);
      load();
      await refreshDetail(selectedId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Record transfer failed");
    } finally {
      setBusy(false);
    }
  };

  const verifyTransfer = async (transferId: number) => {
    if (!selectedId || !verifyNotes.trim()) {
      toast.error("Verification notes are required");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.verifyPayoutTransfer(
        selectedId,
        transferId,
        { notes: verifyNotes.trim() },
        verifyFiles,
      );
      toast.success("Transfer verified");
      setVerifyNotes("");
      setVerifyFiles([]);
      load();
      await refreshDetail(selectedId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const dispute = async (reverse = false) => {
    if (!selectedId || !disputeNotes.trim()) {
      toast.error("Dispute notes are required");
      return;
    }
    setBusy(true);
    try {
      await adminOrdersService.disputePayout(selectedId, {
        notes: disputeNotes.trim(),
        reverse,
      });
      toast.success(reverse ? "Payout marked reversed" : "Payout disputed");
      setDisputeNotes("");
      load();
      await refreshDetail(selectedId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Dispute failed");
    } finally {
      setBusy(false);
    }
  };

  const readinessApproved = bundle?.readiness?.workflowStatus === "approved";
  const startEligible = payout?.startWork?.eligible && !payout.startWork.alreadyStarted;

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
                      {row.production?.displayLabel ? (
                        <p className="text-xs mt-1" data-testid={`admin-payout-label-${row.id}`}>
                          {row.production.displayLabel}
                        </p>
                      ) : null}
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

                {readinessApproved ? (
                  <div
                    className="space-y-3 border-t pt-4"
                    data-testid="admin-payout-panel"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">Initial artisan payout</h3>
                      <Badge
                        variant={startEligible ? "default" : "secondary"}
                        data-testid="admin-start-eligibility"
                      >
                        {payout?.startWork?.alreadyStarted
                          ? "Production started"
                          : startEligible
                            ? "Eligible to Start Work"
                            : "Not eligible to start"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customer payment status (separate): {payout?.customerPaymentStatus ?? "—"}
                    </p>
                    {!payout?.limitPolicy?.configured ? (
                      <p className="text-xs text-amber-700" data-testid="admin-payout-limit-missing">
                        No funding limit policy configured. Approvals above zero require
                        exceptionApproved + reason (or set INITIAL_PAYOUT_LIMITS_JSON).
                      </p>
                    ) : null}
                    <div className="grid gap-2 text-sm">
                      <p data-testid="admin-payout-requested">
                        Requested material:{" "}
                        {materialCost != null
                          ? `${materialCost.toLocaleString()} ${payout?.payout?.currency ?? ""}`
                          : "—"}
                      </p>
                      <p data-testid="admin-payout-approved">
                        Approved amount:{" "}
                        {payout?.payout?.approvedAmount != null
                          ? `${payout.payout.approvedAmount.toLocaleString()} ${payout.payout.currency}`
                          : "—"}
                      </p>
                      <p>
                        Status: {payout?.payout?.status?.replace(/_/g, " ") ?? "—"} · Verified total:{" "}
                        {payout?.payout?.verifiedTotal?.toLocaleString() ?? 0}
                      </p>
                    </div>

                    <div className="space-y-2 rounded border p-3">
                      <p className="text-sm font-medium">Approve funding amount</p>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Approved amount"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        data-testid="admin-payout-amount"
                      />
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={exceptionApproved}
                          onChange={(e) => setExceptionApproved(e.target.checked)}
                          data-testid="admin-payout-exception"
                        />
                        Exception approved (limit missing or exceeded)
                      </label>
                      {exceptionApproved ? (
                        <Textarea
                          placeholder="Exception reason"
                          value={exceptionReason}
                          onChange={(e) => setExceptionReason(e.target.value)}
                          data-testid="admin-payout-exception-reason"
                        />
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void approveAmount()}
                        data-testid="admin-payout-approve-amount"
                      >
                        Approve amount
                      </Button>
                    </div>

                    <div className="space-y-2 rounded border p-3">
                      <p className="text-sm font-medium">In-stock / no production funding</p>
                      <Textarea
                        placeholder="Audited reason (required)"
                        value={notRequiredReason}
                        onChange={(e) => setNotRequiredReason(e.target.value)}
                        data-testid="admin-payout-not-required-reason"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void markNotRequired()}
                        data-testid="admin-payout-not-required"
                      >
                        Mark funding not required
                      </Button>
                    </div>

                    <div className="space-y-2 rounded border p-3">
                      <p className="text-sm font-medium">Record bank transfer</p>
                      <p className="text-xs text-muted-foreground">
                        Recording alone never unlocks Start Work.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          data-testid="admin-payout-transfer-amount"
                        />
                        <Input
                          type="date"
                          value={transferDate}
                          onChange={(e) => setTransferDate(e.target.value)}
                          data-testid="admin-payout-transfer-date"
                        />
                        <Input
                          placeholder="Payee name"
                          value={payeeName}
                          onChange={(e) => setPayeeName(e.target.value)}
                          data-testid="admin-payout-payee"
                        />
                        <Input
                          placeholder="Payee details (bank hint)"
                          value={payeeDetails}
                          onChange={(e) => setPayeeDetails(e.target.value)}
                        />
                        <Input
                          className="sm:col-span-2"
                          placeholder="External transfer reference"
                          value={externalRef}
                          onChange={(e) => setExternalRef(e.target.value)}
                          data-testid="admin-payout-external-ref"
                        />
                        <Input
                          className="sm:col-span-2"
                          type="file"
                          multiple
                          onChange={(e) => setTransferFiles(Array.from(e.target.files ?? []))}
                          data-testid="admin-payout-transfer-files"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void recordTransfer()}
                        data-testid="admin-payout-record-transfer"
                      >
                        Record transfer
                      </Button>
                    </div>

                    {(payout?.payout?.transfers ?? []).map((t) => (
                      <div
                        key={t.id}
                        className="rounded border p-3 space-y-2 text-sm"
                        data-testid={`admin-payout-transfer-${t.id}`}
                      >
                        <p className="font-medium">
                          Transfer #{t.id}: {t.amount.toLocaleString()} {t.currency} · {t.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref {t.externalReference} · Payee {t.payeeName} · Recorded by #{t.recordedById}
                        </p>
                        {t.evidence?.length ? (
                          <ul className="text-xs">
                            {t.evidence.map((e) => (
                              <li key={e.id}>
                                <a className="underline" href={e.url} target="_blank" rel="noreferrer">
                                  {e.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {t.status === "recorded" ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Independent verification notes"
                              value={verifyNotes}
                              onChange={(e) => setVerifyNotes(e.target.value)}
                              data-testid={`admin-payout-verify-notes-${t.id}`}
                            />
                            <Input
                              type="file"
                              multiple
                              onChange={(e) => setVerifyFiles(Array.from(e.target.files ?? []))}
                              data-testid={`admin-payout-verify-files-${t.id}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              onClick={() => void verifyTransfer(t.id)}
                              data-testid={`admin-payout-verify-${t.id}`}
                            >
                              Verify transfer
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}

                    <div className="space-y-2 rounded border p-3">
                      <p className="text-sm font-medium">Dispute / reverse</p>
                      <Textarea
                        placeholder="Notes"
                        value={disputeNotes}
                        onChange={(e) => setDisputeNotes(e.target.value)}
                        data-testid="admin-payout-dispute-notes"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void dispute(false)}
                          data-testid="admin-payout-dispute"
                        >
                          Dispute
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => void dispute(true)}
                          data-testid="admin-payout-reverse"
                        >
                          Mark reversed
                        </Button>
                      </div>
                    </div>

                    {payout?.payout?.events?.length ? (
                      <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                        <p className="font-medium text-sm">Payout audit</p>
                        {payout.payout.events.map((ev) => (
                          <p key={ev.id} className="text-muted-foreground">
                            {ev.action} · #{ev.actorId ?? "—"} ·{" "}
                            {new Date(ev.createdAt).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReadinessPanel;
