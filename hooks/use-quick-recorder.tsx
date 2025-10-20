import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { navCache } from "@/lib/navCache";
import { type RecorderState } from "@/types/recording";
import { toast } from "@/hooks/use-toast";

const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds

interface UseQuickRecorderOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing quick story recording with state machine.
 *
 * State flow: ready → countdown → recording → paused → processing → complete
 *
 * Features:
 * - 3-2-1 countdown before recording
 * - Pause/resume functionality
 * - 5-minute max recording with auto-stop
 * - Automatic transcription via AssemblyAI
 * - NavCache storage for wizard integration
 */
export function useQuickRecorder(options: UseQuickRecorderOptions = {}) {
  const router = useRouter();
  const [state, setState] = useState<RecorderState>("ready");
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseStartTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    audioChunksRef.current = [];
  }, []);

  // Timer effect
  useEffect(() => {
    if (state === "recording") {
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop at 5 minutes
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [state]);

  // Start recording (triggers countdown)
  const startRecording = useCallback(async () => {
    try {
      // Start countdown
      setState("countdown");
      setCountdown(3);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            // Start actual recording after countdown
            beginRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("[useQuickRecorder] Failed to start recording:", error);
      setState("ready");
      options.onError?.(error as Error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [options]);

  // Begin actual recording (after countdown)
  const beginRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!isRestarting) {
          handleRecordingComplete();
        }
      };

      mediaRecorder.start();
      setState("recording");
      setDuration(0);
    } catch (error) {
      console.error("[useQuickRecorder] Failed to begin recording:", error);
      setState("ready");
      options.onError?.(error as Error);
      toast({
        title: "Recording failed",
        description: "Could not start recording. Please try again.",
        variant: "destructive",
      });
    }
  }, [isRestarting, options]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause();
      pauseStartTimeRef.current = Date.now();
      setState("paused");
    }
  }, [state]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume();
      pausedDurationRef.current += Date.now() - pauseStartTimeRef.current;
      setState("recording");
    }
  }, [state]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Restart recording
  const restartRecording = useCallback(() => {
    if (
      window.confirm(
        "This will discard your current recording. Are you sure you want to restart?"
      )
    ) {
      setIsRestarting(true);

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      cleanup();
      setDuration(0);
      setAudioBlob(null);
      setState("ready");
      pausedDurationRef.current = 0;

      setTimeout(() => {
        setIsRestarting(false);
      }, 100);
    }
  }, [cleanup]);

  // Handle recording completion
  const handleRecordingComplete = useCallback(async () => {
    if (isRestarting) {
      console.log("[useQuickRecorder] Restart in progress, skipping completion");
      return;
    }

    setState("processing");

    try {
      // Create blob from chunks
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);

      console.log("[useQuickRecorder] Recording complete, transcribing...");

      // Transcribe with AssemblyAI
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const response = await fetch("/api/transcribe-assemblyai", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const { transcription } = await response.json();

      console.log("[useQuickRecorder] Transcription complete:", transcription);

      // Save to NavCache
      const navId = navCache.generateId();
      navCache.set(navId, {
        mode: "quick",
        rawTranscript: transcription,
        duration: duration,
        timestamp: new Date().toISOString(),
        audioBlob: blob,
        fromModal: true,
      });

      console.log("[useQuickRecorder] Saved to NavCache with ID:", navId);

      // Cleanup
      cleanup();

      // Navigate to wizard
      router.push(`/review/book-style?nav=${navId}&mode=wizard`);

      options.onComplete?.();
    } catch (error) {
      console.error("[useQuickRecorder] Error processing recording:", error);
      setState("ready");
      options.onError?.(error as Error);
      toast({
        title: "Processing failed",
        description: "Could not process your recording. Please try again.",
        variant: "destructive",
      });
    }
  }, [isRestarting, duration, router, cleanup, options]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (state === "countdown" && countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    cleanup();
    setDuration(0);
    setAudioBlob(null);
    setState("ready");
  }, [state, cleanup]);

  return {
    state,
    duration,
    countdown,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    restartRecording,
    cancelRecording,
    maxDuration: MAX_RECORDING_DURATION,
  };
}
