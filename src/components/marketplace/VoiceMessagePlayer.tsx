import { useEffect, useRef, useState } from "react";
import { Pause, Play, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRecordingTime } from "@/lib/voiceRecording";
import { messagingService } from "@/lib/apiServices";

type VoiceMessagePlayerProps = {
  /** Local blob URL or auth-gated API path. */
  src?: string | null;
  /** Auth-gated relative attachment path from the API. */
  attachmentPath?: string | null;
  durationMs?: number | null;
  className?: string;
  compact?: boolean;
};

const VoiceMessagePlayer = ({
  src,
  attachmentPath,
  durationMs,
  className,
  compact,
}: VoiceMessagePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioDurationMs, setAudioDurationMs] = useState(durationMs ?? 0);

  useEffect(() => {
    setAudioDurationMs(durationMs ?? 0);
  }, [durationMs]);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;

    const load = async () => {
      setError(null);
      setProgress(0);
      setPlaying(false);
      if (src && (src.startsWith("blob:") || src.startsWith("data:") || /^https?:\/\//i.test(src))) {
        setBlobUrl(src);
        return;
      }
      const path = attachmentPath || src;
      if (!path) {
        setError("Missing audio");
        return;
      }
      setLoading(true);
      try {
        const url = await messagingService.fetchAttachmentBlobUrl(path);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        created = url;
        setBlobUrl(url);
      } catch {
        if (!cancelled) setError("Could not load voice note");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [src, attachmentPath]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setAudioDurationMs(Math.round(dur * 1000));
        setProgress(audio.currentTime / dur);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [blobUrl]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setError("Playback failed");
    }
  };

  const displayMs =
    playing || progress > 0
      ? Math.round((audioDurationMs || 0) * progress)
      : audioDurationMs || durationMs || 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-[160px]",
        compact ? "max-w-[220px]" : "max-w-[280px]",
        className,
      )}
      data-testid="voice-message-player"
    >
      {blobUrl ? <audio ref={audioRef} src={blobUrl} preload="metadata" /> : null}
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => void toggle()}
        disabled={loading || !!error || !blobUrl}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : error ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="h-1.5 rounded-full bg-black/15 overflow-hidden">
          <div
            className="h-full bg-current transition-[width] duration-100"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] opacity-80 tabular-nums">
          <span>{formatRecordingTime(displayMs)}</span>
          <span>{formatRecordingTime(audioDurationMs || durationMs || 0)}</span>
        </div>
        {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
