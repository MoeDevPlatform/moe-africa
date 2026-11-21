import { useEffect, useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceMessagePlayer from "@/components/marketplace/VoiceMessagePlayer";
import {
  messagingService,
  type MessageAttachment,
} from "@/lib/apiServices";
import { toast } from "sonner";

type MessageAttachmentViewProps = {
  attachment: MessageAttachment;
  durationMs?: number | null;
  compact?: boolean;
};

/** Renders private message media without exposing the Cloudinary asset URL. */
const MessageAttachmentView = ({
  attachment,
  durationMs,
  compact,
}: MessageAttachmentViewProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(attachment.kind === "image");

  useEffect(() => {
    if (attachment.kind !== "image") return;
    let active = true;
    let blobUrl: string | null = null;
    setLoading(true);
    messagingService
      .fetchAttachmentBlobUrl(attachment.url)
      .then((url) => {
        blobUrl = url;
        if (active) setImageUrl(url);
      })
      .catch(() => {
        if (active) toast.error("Could not load image attachment");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [attachment.kind, attachment.url]);

  if (attachment.kind === "voice") {
    return (
      <VoiceMessagePlayer
        attachmentPath={attachment.url}
        durationMs={attachment.durationMs ?? durationMs}
        compact={compact}
      />
    );
  }

  const openAttachment = async () => {
    try {
      const url =
        attachment.kind === "image" && imageUrl
          ? imageUrl
          : await messagingService.fetchAttachmentBlobUrl(attachment.url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open attachment");
    }
  };

  if (attachment.kind === "image") {
    return (
      <button
        type="button"
        onClick={() => void openAttachment()}
        className="block max-w-xs overflow-hidden rounded-md border text-left"
        aria-label={`Open image ${attachment.name}`}
      >
        {loading ? (
          <span className="flex h-28 w-44 items-center justify-center bg-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        ) : imageUrl ? (
          <img src={imageUrl} alt={attachment.name || "Shared image"} className="max-h-56 w-auto object-cover" />
        ) : (
          <span className="flex items-center gap-2 p-3 text-xs">
            <ImageIcon className="h-4 w-4" /> Image unavailable
          </span>
        )}
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void openAttachment()}>
      <FileText className="mr-2 h-4 w-4" />
      <span className="max-w-48 truncate">{attachment.name || "Attachment"}</span>
      <Download className="ml-2 h-3.5 w-3.5" />
    </Button>
  );
};

export default MessageAttachmentView;
