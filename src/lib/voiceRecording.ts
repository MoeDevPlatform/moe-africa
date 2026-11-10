/** Preferred MediaRecorder MIME types — Safari prefers mp4; Chrome/Firefox prefer webm/ogg. */
const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function extensionForMime(mimeType: string): string {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  if (base.includes("mp4") || base.includes("aac") || base.includes("m4a")) return "m4a";
  if (base.includes("ogg")) return "ogg";
  if (base.includes("mpeg") || base.includes("mp3")) return "mp3";
  if (base.includes("wav")) return "wav";
  return "webm";
}

export function formatRecordingTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function recordingErrorMessage(err: unknown): string {
  if (!err) return "Recording failed";
  const name =
    typeof err === "object" && err && "name" in err
      ? String((err as { name?: string }).name)
      : "";
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";

  if (name === "NotAllowedError" || /permission|denied/i.test(message)) {
    return "Microphone permission denied. Enable access in your browser settings and try again.";
  }
  if (name === "NotFoundError" || /not found|no device/i.test(message)) {
    return "No microphone found. Connect a microphone and try again.";
  }
  if (name === "NotReadableError" || /in use|busy/i.test(message)) {
    return "Microphone is unavailable. Close other apps using it and try again.";
  }
  if (/MediaRecorder|getUserMedia|secure/i.test(message)) {
    return "Voice recording is not available in this browser. Try Chrome or Safari over HTTPS.";
  }
  return message || "Recording failed";
}

export type VoiceDraft = {
  blob: Blob;
  file: File;
  objectUrl: string;
  durationMs: number;
  mimeType: string;
  clientKey: string;
};

export function buildVoiceDraft(blob: Blob, durationMs: number, mimeType: string): VoiceDraft {
  const type = blob.type || mimeType || "audio/webm";
  const ext = extensionForMime(type);
  const clientKey =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `voice_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const file = new File([blob], `voice-note.${ext}`, { type });
  return {
    blob,
    file,
    objectUrl: URL.createObjectURL(blob),
    durationMs,
    mimeType: type,
    clientKey,
  };
}
