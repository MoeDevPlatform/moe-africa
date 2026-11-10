import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildVoiceDraft,
  pickRecorderMimeType,
  recordingErrorMessage,
  type VoiceDraft,
} from "@/lib/voiceRecording";

export type VoiceRecorderPhase = "idle" | "recording" | "preview" | "error";

const MIN_DURATION_MS = 400;

export function useVoiceRecorder() {
  const [phase, setPhase] = useState<VoiceRecorderPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<VoiceDraft | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const mimeTypeRef = useRef("audio/webm");
  const cancelRequestedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const revokeDraft = useCallback((current?: VoiceDraft | null) => {
    const target = current ?? draft;
    if (target?.objectUrl) URL.revokeObjectURL(target.objectUrl);
  }, [draft]);

  const reset = useCallback(() => {
    cancelRequestedRef.current = true;
    clearTimer();
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    } catch {
      /* ignore */
    }
    mediaRecorderRef.current = null;
    stopTracks();
    chunksRef.current = [];
    revokeDraft();
    setDraft(null);
    setElapsedMs(0);
    setError(null);
    setPhase("idle");
    cancelRequestedRef.current = false;
  }, [revokeDraft]);

  useEffect(() => () => reset(), [reset]);

  const start = useCallback(async () => {
    setError(null);
    revokeDraft();
    setDraft(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const msg = "Voice recording is not supported in this browser.";
      setError(msg);
      setPhase("error");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      const msg = "Voice recording is not supported in this browser.";
      setError(msg);
      setPhase("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      mimeTypeRef.current = mimeType || "audio/webm";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      cancelRequestedRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        clearTimer();
        stopTracks();
        setError("Recording failed");
        setPhase("error");
      };

      recorder.onstop = () => {
        clearTimer();
        stopTracks();
        if (cancelRequestedRef.current) {
          chunksRef.current = [];
          return;
        }
        const durationMs = Math.max(0, Date.now() - startedAtRef.current);
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        chunksRef.current = [];
        if (durationMs < MIN_DURATION_MS || blob.size < 256) {
          setError("Recording was empty or too short. Hold a bit longer, then stop.");
          setPhase("error");
          return;
        }
        const next = buildVoiceDraft(blob, durationMs, mimeTypeRef.current);
        setDraft(next);
        setElapsedMs(durationMs);
        setPhase("preview");
      };

      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setPhase("recording");
      recorder.start(250);
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 200);
    } catch (err) {
      stopTracks();
      const msg = recordingErrorMessage(err);
      setError(msg);
      setPhase("error");
    }
  }, [revokeDraft]);

  const stop = useCallback(() => {
    cancelRequestedRef.current = false;
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      setError("Could not stop recording");
      setPhase("error");
      stopTracks();
      clearTimer();
    }
  }, []);

  const cancel = useCallback(() => {
    cancelRequestedRef.current = true;
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    } else {
      stopTracks();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    revokeDraft();
    setDraft(null);
    setElapsedMs(0);
    setError(null);
    setPhase("idle");
  }, [revokeDraft]);

  const clearDraft = useCallback(() => {
    revokeDraft();
    setDraft(null);
    setElapsedMs(0);
    setError(null);
    setPhase("idle");
  }, [revokeDraft]);

  return {
    phase,
    elapsedMs,
    error,
    draft,
    start,
    stop,
    cancel,
    clearDraft,
    reset,
    setError,
  };
}
