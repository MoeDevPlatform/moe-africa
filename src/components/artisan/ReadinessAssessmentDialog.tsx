import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ordersService,
  type Order,
  type OrderReadinessBundle,
} from "@/lib/apiServices";
import { MoeApiError } from "@/lib/moeApi";
import VoiceComposer from "@/components/marketplace/VoiceComposer";
import type { VoiceDraft } from "@/lib/voiceRecording";
import { Paperclip, X } from "lucide-react";

type Props = {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
};

const draftKey = (orderId: string) => `moe_readiness_draft_${orderId}`;

const ReadinessAssessmentDialog = ({ order, open, onOpenChange, onSubmitted }: Props) => {
  const [bundle, setBundle] = useState<OrderReadinessBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [cannotFulfil, setCannotFulfil] = useState(false);
  const [cannotFulfilReason, setCannotFulfilReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);

  // Standard
  const [productAvailable, setProductAvailable] = useState(false);
  const [exactSpecMatch, setExactSpecMatch] = useState(false);
  const [quantityConfirmed, setQuantityConfirmed] = useState(false);
  const [canFulfil, setCanFulfil] = useState(true);
  const [estimatedDispatchDate, setEstimatedDispatchDate] = useState("");
  const [fulfilmentIssue, setFulfilmentIssue] = useState("");

  // Detailed
  const [workDescription, setWorkDescription] = useState("");
  const [specificationsConfirmed, setSpecificationsConfirmed] = useState(false);
  const [dimensionsNotes, setDimensionsNotes] = useState("");
  const [materialsRequired, setMaterialsRequired] = useState("");
  const [equipmentRequired, setEquipmentRequired] = useState("");
  const [skillsConfirmed, setSkillsConfirmed] = useState(false);
  const [capacityConfirmed, setCapacityConfirmed] = useState(false);
  const [estimatedMaterialCost, setEstimatedMaterialCost] = useState("");
  const [proposedProductionDays, setProposedProductionDays] = useState("");
  const [productionSteps, setProductionSteps] = useState("");
  const [limitations, setLimitations] = useState("");
  const [matchesCustomerRequirements, setMatchesCustomerRequirements] = useState(false);

  const assessmentType = bundle?.readiness?.assessmentType ?? "standard";

  useEffect(() => {
    if (!open || !order) return;
    setLoading(true);
    ordersService
      .getReadiness(order.id)
      .then((res) => {
        setBundle(res);
        try {
          const raw = localStorage.getItem(draftKey(order.id));
          if (raw) {
            const d = JSON.parse(raw) as Record<string, unknown>;
            if (typeof d.workDescription === "string") setWorkDescription(d.workDescription);
            if (typeof d.materialsRequired === "string") setMaterialsRequired(d.materialsRequired);
            if (typeof d.estimatedDispatchDate === "string") {
              setEstimatedDispatchDate(d.estimatedDispatchDate);
            }
          }
        } catch {
          /* ignore */
        }
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Failed to load readiness");
      })
      .finally(() => setLoading(false));
  }, [open, order]);

  useEffect(() => {
    if (!order) return;
    const payload = {
      workDescription,
      materialsRequired,
      estimatedDispatchDate,
    };
    try {
      localStorage.setItem(draftKey(order.id), JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [order, workDescription, materialsRequired, estimatedDispatchDate]);

  const requirements = useMemo(() => bundle?.customerRequirements, [bundle]);

  const handleVoice = async (draft: VoiceDraft) => {
    setVoiceFile(draft.file);
    toast.success("Voice memo attached");
  };

  const handleSubmit = async () => {
    if (!order) return;
    if (!cannotFulfil && !acknowledged) {
      toast.error("Review and acknowledge the order requirements first");
      return;
    }
    setSubmitting(true);
    try {
      const payload =
        cannotFulfil
          ? {}
          : assessmentType === "standard"
            ? {
                productAvailable,
                exactSpecMatch,
                quantityConfirmed,
                canFulfil,
                estimatedDispatchDate,
                fulfilmentIssue: canFulfil ? null : fulfilmentIssue,
              }
            : {
                workDescription,
                specificationsConfirmed,
                dimensionsNotes: dimensionsNotes || null,
                materialsRequired,
                equipmentRequired,
                skillsConfirmed,
                capacityConfirmed,
                estimatedMaterialCost: Number(estimatedMaterialCost),
                proposedProductionDays: Number(proposedProductionDays),
                productionSteps: productionSteps
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
                limitations: limitations || null,
                matchesCustomerRequirements,
              };

      const uploadFiles = [...files];
      if (voiceFile) uploadFiles.push(voiceFile);

      await ordersService.submitReadiness(
        order.id,
        {
          cannotFulfil,
          cannotFulfilReason: cannotFulfil ? cannotFulfilReason : undefined,
          acknowledgedRequirements: acknowledged || cannotFulfil,
          reviewedRequirementsAt: new Date().toISOString(),
          payload,
        },
        uploadFiles,
      );
      try {
        localStorage.removeItem(draftKey(order.id));
      } catch {
        /* ignore */
      }
      toast.success(
        cannotFulfil
          ? "Inability to fulfil recorded for admin review"
          : "Readiness submitted for admin review",
      );
      onOpenChange(false);
      onSubmitted?.();
    } catch (e: unknown) {
      toast.error(
        e instanceof MoeApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Submission failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="readiness-dialog">
        <DialogHeader>
          <DialogTitle>Accept & Submit Readiness</DialogTitle>
          <DialogDescription>
            Review the customer order requirements, then submit your readiness assessment.
          </DialogDescription>
        </DialogHeader>

        {loading || !bundle ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-6">
            <section className="rounded-lg border bg-muted/40 p-4 space-y-2" data-testid="readiness-requirements">
              <h3 className="font-semibold text-sm">Customer order requirements</h3>
              <p className="text-sm font-medium">{requirements?.productName}</p>
              <p className="text-xs text-muted-foreground">
                Qty {requirements?.quantity ?? 1}
                {requirements?.price != null
                  ? ` · ₦${Number(requirements.price).toLocaleString()}`
                  : ""}
                {requirements?.estimatedDelivery
                  ? ` · Delivery: ${requirements.estimatedDelivery}`
                  : ""}
                {requirements?.rushOrder ? " · Rush order" : ""}
              </p>
              {requirements?.customisationData ? (
                <pre className="text-xs whitespace-pre-wrap bg-background rounded p-2 border overflow-x-auto">
                  {JSON.stringify(requirements.customisationData, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">No additional customisation fields.</p>
              )}
              <label className="flex items-center gap-2 text-sm pt-2">
                <Checkbox
                  checked={acknowledged}
                  onCheckedChange={(v) => setAcknowledged(v === true)}
                  data-testid="readiness-acknowledge"
                />
                I have reviewed these order requirements
              </label>
            </section>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={cannotFulfil}
                onCheckedChange={(v) => setCannotFulfil(v === true)}
                data-testid="readiness-cannot-fulfil"
              />
              I cannot fulfil this order
            </label>
            {cannotFulfil ? (
              <div className="space-y-2">
                <Label htmlFor="cannot-reason">Reason</Label>
                <Textarea
                  id="cannot-reason"
                  value={cannotFulfilReason}
                  onChange={(e) => setCannotFulfilReason(e.target.value)}
                  data-testid="readiness-cannot-reason"
                />
              </div>
            ) : assessmentType === "standard" ? (
              <section className="space-y-3" data-testid="readiness-standard-form">
                <h3 className="font-semibold text-sm">Standard readiness</h3>
                {(
                  [
                    ["Product available", productAvailable, setProductAvailable],
                    ["Exact product/spec match", exactSpecMatch, setExactSpecMatch],
                    ["Quantity confirmed", quantityConfirmed, setQuantityConfirmed],
                    ["Able to fulfil", canFulfil, setCanFulfil],
                  ] as const
                ).map(([label, value, setter]) => (
                  <label key={label} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={value} onCheckedChange={(v) => setter(v === true)} />
                    {label}
                  </label>
                ))}
                <div className="space-y-1">
                  <Label htmlFor="dispatch">Estimated dispatch / fulfilment date</Label>
                  <Input
                    id="dispatch"
                    type="date"
                    value={estimatedDispatchDate}
                    onChange={(e) => setEstimatedDispatchDate(e.target.value)}
                    data-testid="readiness-dispatch-date"
                  />
                </div>
                {!canFulfil ? (
                  <div className="space-y-1">
                    <Label htmlFor="issue">Issue preventing fulfilment</Label>
                    <Textarea
                      id="issue"
                      value={fulfilmentIssue}
                      onChange={(e) => setFulfilmentIssue(e.target.value)}
                    />
                  </div>
                ) : null}
              </section>
            ) : (
              <section className="space-y-3" data-testid="readiness-detailed-form">
                <h3 className="font-semibold text-sm">Detailed readiness</h3>
                <p className="text-xs text-muted-foreground">
                  Material costs are estimates for later review — not approved payouts.
                </p>
                <div className="space-y-1">
                  <Label>Description of required work</Label>
                  <Textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    data-testid="readiness-work-description"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={specificationsConfirmed}
                    onCheckedChange={(v) => setSpecificationsConfirmed(v === true)}
                  />
                  Important specifications / dimensions confirmed
                </label>
                <div className="space-y-1">
                  <Label>Dimensions notes</Label>
                  <Textarea value={dimensionsNotes} onChange={(e) => setDimensionsNotes(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Materials required</Label>
                  <Textarea
                    value={materialsRequired}
                    onChange={(e) => setMaterialsRequired(e.target.value)}
                    data-testid="readiness-materials"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Equipment required</Label>
                  <Textarea
                    value={equipmentRequired}
                    onChange={(e) => setEquipmentRequired(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={skillsConfirmed}
                    onCheckedChange={(v) => setSkillsConfirmed(v === true)}
                  />
                  Skills confirmed
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={capacityConfirmed}
                    onCheckedChange={(v) => setCapacityConfirmed(v === true)}
                  />
                  Production capacity confirmed
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Estimated material cost (NGN)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={estimatedMaterialCost}
                      onChange={(e) => setEstimatedMaterialCost(e.target.value)}
                      data-testid="readiness-material-cost"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Proposed production days</Label>
                    <Input
                      type="number"
                      min={1}
                      value={proposedProductionDays}
                      onChange={(e) => setProposedProductionDays(e.target.value)}
                      data-testid="readiness-production-days"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Production steps (one per line)</Label>
                  <Textarea
                    value={productionSteps}
                    onChange={(e) => setProductionSteps(e.target.value)}
                    data-testid="readiness-steps"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Limitations / dependencies</Label>
                  <Textarea value={limitations} onChange={(e) => setLimitations(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={matchesCustomerRequirements}
                    onCheckedChange={(v) => setMatchesCustomerRequirements(v === true)}
                    data-testid="readiness-matches"
                  />
                  I acknowledge this plan matches the customer-approved requirements
                </label>
              </section>
            )}

            {!cannotFulfil ? (
              <section className="space-y-3">
                <h3 className="font-semibold text-sm">Supporting evidence</h3>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  data-testid="readiness-files"
                />
                {files.length > 0 ? (
                  <ul className="text-xs space-y-1">
                    {files.map((f) => (
                      <li key={f.name} className="flex items-center gap-2">
                        <Paperclip className="h-3 w-3" />
                        {f.name}
                        <button
                          type="button"
                          className="ml-auto"
                          onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <VoiceComposer onSend={handleVoice} compact disabled={submitting} />
                {voiceFile ? (
                  <p className="text-xs text-muted-foreground">Voice memo ready: {voiceFile.name}</p>
                ) : null}
              </section>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || loading}
            data-testid="readiness-submit"
          >
            {submitting ? "Submitting…" : "Submit readiness"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReadinessAssessmentDialog;
