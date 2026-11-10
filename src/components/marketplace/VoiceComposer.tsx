import { useEffect } from "react";
import { Mic, Square, X, Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRecordingTime } from "@/lib/voiceRecording";
import { useVoiceRecorder, type VoiceRecorderPhase } from "@/hooks/useVoiceRecorder";
import VoiceMessagePlayer from "@/components/marketplace/VoiceMessagePlayer";
import type { VoiceDraft } from "@/lib/voiceRecording";

type VoiceComposerProps = {
  disabled?: boolean;
  sending?: boolean;
  compact?: boolean;
  onSend: (draft: VoiceDraft) => void | Promise<void>;
  onPhaseChange?: (phase: VoiceRecorderPhase) => void;
  className?: string;
};

/**
 * Microphone → record (timer + stop/cancel) → preview/replay/delete/send.
 * Shared by full-page ChatThread, embedded floating panel, and MessagingModal.
 */
const VoiceComposer = ({
  disabled,
  sending,
  compact,
  onSend,
  onPhaseChange,
  className,
}: VoiceComposerProps) => {
  const recorder = useVoiceRecorder();
  const busy = disabled || sending;

  useEffect(() => {
    onPhaseChange?.(recorder.phase);
  }, [recorder.phase, onPhaseChange]);

  const handleSend = async () => {
    if (!recorder.draft || busy) return;
    const draft = recorder.draft;
    try {
      await onSend(draft);
      recorder.clearDraft();
    } catch {
      // Parent surfaces the error; keep preview for Retry.
    }
  };

  if (recorder.phase === "recording") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-2 py-1.5",
          className,
        )}
        data-testid="voice-recording"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
        </span>
        <span className="text-sm font-medium tabular-nums text-destructive">
          {formatRecordingTime(recorder.elapsedMs)}
        </span>
        <span className="text-xs text-muted-foreground flex-1">Recording…</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={recorder.cancel}
          aria-label="Cancel recording"
          data-testid="voice-cancel"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={recorder.stop}
          aria-label="Stop recording"
          data-testid="voice-stop"
        >
          <Square className="h-3.5 w-3.5 mr-1 fill-current" />
          Stop
        </Button>
      </div>
    );
  }

  if (recorder.phase === "preview" && recorder.draft) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1.5",
          className,
        )}
        data-testid="voice-preview"
      >
        <VoiceMessagePlayer
          src={recorder.draft.objectUrl}
          durationMs={recorder.draft.durationMs}
          compact={compact}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={recorder.clearDraft}
          disabled={busy}
          aria-label="Delete voice note"
          data-testid="voice-delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size={compact ? "sm" : "default"}
          onClick={() => void handleSend()}
          disabled={busy}
          aria-label="Send voice note"
          data-testid="voice-send"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Send
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        disabled={busy}
        onClick={() => void recorder.start()}
        aria-label="Record voice message"
        data-testid="voice-mic"
      >
        <Mic className="h-4 w-4" />
      </Button>
      {recorder.error ? (
        <p className="text-xs text-destructive max-w-[200px]" role="alert" data-testid="voice-error">
          {recorder.error}
        </p>
      ) : null}
    </div>
  );
};

export default VoiceComposer;
