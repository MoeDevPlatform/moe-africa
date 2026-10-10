import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { customOrderService } from "@/lib/apiServices";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface RequestCustomOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artisanId: number;
  artisanName: string;
}

const RequestCustomOrderModal = ({
  open,
  onOpenChange,
  artisanId,
  artisanName,
}: RequestCustomOrderModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setDescription("");
    setBudget("");
    setDeadline("");
    setImages([]);
    setError("");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - images.length;
    const slice = Array.from(files).slice(0, remaining);
    const urls: string[] = [];
    for (const f of slice) {
      urls.push(URL.createObjectURL(f));
    }
    setImages((prev) => [...prev, ...urls].slice(0, 3));
  };

  const handleSubmit = async () => {
    setError("");
    if (!user) {
      navigate("/auth");
      return;
    }
    if (description.trim().length < 30) {
      setError("Please describe your request in at least 30 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await customOrderService.createCommission({
        artisanId,
        description: description.trim(),
        referenceImages: images,
        budget: budget.trim() ? Number(budget) : undefined,
        deadline: deadline.trim() || undefined,
      });
      toast.success(
        `Your custom order request has been sent to ${artisanName}. They will respond within 48 hours.`,
      );
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not send custom order request.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a custom order</DialogTitle>
          <DialogDescription>
            Commission a bespoke piece from {artisanName}. Separate from product
            variations — this is a direct commission request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="co-desc">Description *</Label>
            <Textarea
              id="co-desc"
              data-testid="custom-order-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want made (min 30 characters)…"
            />
            <p className="text-xs text-muted-foreground">
              {description.trim().length}/30 minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="co-images">Reference images (optional, max 3)</Label>
            <Input
              id="co-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onFiles(e.target.files)}
            />
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt="Reference"
                    className="h-16 w-16 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="co-budget">Budget (₦, optional)</Label>
              <Input
                id="co-budget"
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-deadline">Deadline (optional)</Label>
              <Input
                id="co-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button data-testid="submit-custom-order-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…
              </>
            ) : (
              "Submit request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCustomOrderModal;
