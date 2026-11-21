import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VoiceComposer from "@/components/marketplace/VoiceComposer";
import MessageAttachmentView from "@/components/marketplace/MessageAttachmentView";
import {
  MESSAGE_ATTACHMENT_ACCEPT_ATTR,
  supportService,
  validateMessageAttachment,
  type OrderComplaint,
} from "@/lib/apiServices";
import type { VoiceDraft } from "@/lib/voiceRecording";
import { toast } from "sonner";

type Props = {
  orderId: string;
  orderReference: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const OrderComplaintDialog = ({ orderId, orderReference, open, onOpenChange }: Props) => {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [voice, setVoice] = useState<VoiceDraft | null>(null);
  const [history, setHistory] = useState<OrderComplaint[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadHistory = () =>
    supportService
      .listOrderComplaints(orderId)
      .then(setHistory)
      .catch(() => undefined);

  useEffect(() => {
    if (open) void loadHistory();
  }, [open, orderId]);

  const pickFiles = (picked: File[]) => {
    try {
      picked.forEach(validateMessageAttachment);
      setFiles(picked.slice(0, 5));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unsupported supporting file");
    }
  };

  const submit = async () => {
    if (!category || description.trim().length < 10) {
      toast.error("Choose a category and describe the problem in at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      await supportService.createOrderComplaint({
        orderId,
        category,
        description: description.trim(),
        files,
        voice: voice ? { file: voice.file, durationMs: voice.durationMs } : null,
      });
      setSubmitted(true);
      setCategory("");
      setDescription("");
      setFiles([]);
      setVoice(null);
      await loadHistory();
      toast.success("Complaint submitted to MOE Support");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact MOE Support / Report a Problem</DialogTitle>
          <DialogDescription>Order reference: {orderReference}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">
            Your complaint was submitted. Its status and support history appear below.
          </p>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Complaint category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="artisan-complaint-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_requirements">Customer requirements</SelectItem>
                <SelectItem value="materials_or_funding">Materials or funding</SelectItem>
                <SelectItem value="production_or_deadline">Production or deadline</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="payment_or_payout">Payment or payout</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="artisan-complaint-description">Description</Label>
            <Textarea
              id="artisan-complaint-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain what happened and what help you need…"
              rows={4}
              data-testid="artisan-complaint-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artisan-complaint-files">Supporting files or images</Label>
            <Input
              id="artisan-complaint-files"
              type="file"
              multiple
              accept={`${MESSAGE_ATTACHMENT_ACCEPT_ATTR},audio/*`}
              onChange={(event) => pickFiles(Array.from(event.target.files ?? []))}
              data-testid="artisan-complaint-files"
            />
            {files.length ? <p className="text-xs text-muted-foreground"><Paperclip className="mr-1 inline h-3 w-3" />{files.map((file) => file.name).join(", ")}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Optional voice note</Label>
            <VoiceComposer onSend={(draft) => setVoice(draft)} disabled={submitting} />
            {voice ? <p className="text-xs text-muted-foreground">Voice note attached: {voice.file.name}</p> : null}
          </div>
        </div>

        {history.length ? (
          <div className="space-y-3 border-t pt-4" data-testid="artisan-complaint-history">
            <h3 className="font-medium">Complaint status and history</h3>
            {history.map((ticket) => (
              <div key={ticket.id} className="rounded-md border p-3 text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">#{ticket.id} · {ticket.category.replace(/_/g, " ")}</span>
                  <span className="capitalize">{ticket.status.replace(/_/g, " ")}</span>
                </div>
                <p>{ticket.description}</p>
                {ticket.attachments.map((attachment) => (
                  <MessageAttachmentView key={attachment.id} attachment={attachment} compact />
                ))}
                {ticket.history.map((event) => (
                  <p key={event.id} className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()} · {event.status.replace(/_/g, " ")}{event.note ? ` — ${event.note}` : ""}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting} data-testid="artisan-complaint-submit">
            {submitting ? "Submitting…" : "Submit complaint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderComplaintDialog;
