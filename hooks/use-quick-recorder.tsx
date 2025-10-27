import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { navCache } from "@/lib/navCache";
import { type RecorderState } from "@/types/recording";
import { toast } from "@/hooks/use-toast";
import { useRecordingState } from "@/contexts/RecordingContext";

const MAX_RECORDING_DURATION = 600; // 10 minutes in seconds

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
  const { startRecording: startGlobalRecording, stopRecording: stopGlobalRecording } = useRecordingState();
  const [state, setState] = useState<RecorderState>("ready");
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [audioReviewUrl, setAudioReviewUrl] = useState<string | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseStartTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const transcriptionAbortControllerRef = useRef<AbortController | null>(null);
  const durationRef = useRef<number>(0); // Track current duration for reliable access

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

    // Stop global recording state
    stopGlobalRecording();
  }, [stopGlobalRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Stop recording if component unmounts
      if (state === "recording" || state === "paused") {
        stopGlobalRecording();
      }
    };
  }, [state, stopGlobalRecording]);

  // Timer effect
  useEffect(() => {
    if (state === "recording") {
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          durationRef.current = newDuration; // Keep ref in sync
          // Auto-stop at 10 minutes
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
      durationRef.current = 0; // Reset duration ref

      // Set global recording state
      startGlobalRecording('quick-story');
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
  }, [isRestarting, options, startGlobalRecording, toast]);

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

  // Restart recording (confirmation should be handled by component)
  const restartRecording = useCallback(() => {
    setIsRestarting(true);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    cleanup();
    setDuration(0);
    durationRef.current = 0; // Reset duration ref
    setAudioBlob(null);
    setState("ready");
    pausedDurationRef.current = 0;

    setTimeout(() => {
      setIsRestarting(false);
    }, 100);
  }, [cleanup]);

  // Background transcription
  const startBackgroundTranscription = useCallback(async (blob: Blob) => {
    console.log("[useQuickRecorder] Starting background transcription");

    // Set status to processing
    setTranscriptionStatus('processing');

    // Create abort controller for cancellation
    const abortController = new AbortController();
    transcriptionAbortControllerRef.current = abortController;

    try {
      // Transcribe with AssemblyAI
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const response = await fetch("/api/transcribe-assemblyai", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      const transcription = data.transcription || "";

      console.log("[useQuickRecorder] Background transcription complete:", transcription);

      // Set status to complete
      setTranscriptionStatus('complete');

      // Store results for transcription selection screen to pick up
      sessionStorage.setItem('hw_transcription_result', JSON.stringify({
        transcription: transcription,
        lessonOptions: data.lessonOptions,
        formattedContent: data.formattedContent,
      }));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('hw_transcription_complete', {
        detail: {
          transcription: transcription,
          lessonOptions: data.lessonOptions,
          formattedContent: data.formattedContent,
        }
      }));

    } catch (error) {
      // Don't set error if request was aborted (user re-recorded)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("[useQuickRecorder] Background transcription cancelled");
        setTranscriptionStatus('idle');
        return;
      }

      console.error("[useQuickRecorder] Background transcription error:", error);

      // Set status to error
      setTranscriptionStatus('error');

      // Store error state
      sessionStorage.setItem('hw_transcription_error', 'true');
      window.dispatchEvent(new CustomEvent('hw_transcription_error'));
    }
  }, []);

  // Handle recording completion - show audio review screen
  const handleRecordingComplete = useCallback(async () => {
    if (isRestarting) {
      console.log("[useQuickRecorder] Restart in progress, skipping completion");
      return;
    }

    try {
      // Create blob from chunks
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);

      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(blob);
      setAudioReviewUrl(audioUrl);

      // Use ref for current duration (more reliable than state closure)
      const currentDuration = durationRef.current;
      console.log("[useQuickRecorder] Recording complete, showing review screen. Duration:", currentDuration, "seconds");

      // Show review screen (not processing yet)
      setState("review");

      // AUTO-START transcription if recording is >= 30 seconds
      if (currentDuration >= 30) {
        console.log("[useQuickRecorder] ✅ Auto-starting background transcription (recording >= 30s)");
        startBackgroundTranscription(blob);
      } else {
        console.log("[useQuickRecorder] ⏭️ Recording < 30s, skipping auto-transcription");
      }
    } catch (error) {
      console.error("[useQuickRecorder] Error creating audio blob:", error);
      setState("ready");
      options.onError?.(error as Error);
      toast({
        title: "Recording failed",
        description: "Could not save your recording. Please try again.",
        variant: "destructive",
      });
    }
  }, [isRestarting, options, startBackgroundTranscription, toast]);

  // Handle continue from review - check if transcription is ready or still processing
  const continueFromReview = useCallback(async () => {
    console.log("[useQuickRecorder] continueFromReview called - transcriptionStatus:", transcriptionStatus, "state:", state, "duration:", duration);

    if (!audioBlob) {
      console.error("[useQuickRecorder] No audio blob to process");
      return;
    }

    // Check if background transcription already completed
    const existingResult = sessionStorage.getItem('hw_transcription_result');
    console.log("[useQuickRecorder] existingResult from sessionStorage:", existingResult ? "EXISTS" : "NULL");

    // PATH A: Transcription complete → Navigate with data
    if (existingResult && transcriptionStatus === 'complete') {
      console.log("[useQuickRecorder] PATH A: Transcription complete! Navigating with data...");

      // Parse the result
      const { transcription, lessonOptions, formattedContent } = JSON.parse(existingResult);

      // Navigate to transcription selection screen with completed data
      const navId = navCache.generateId();
      await navCache.set(navId, {
        mode: "quick",
        originalTranscript: transcription,
        rawTranscript: transcription, // Also set rawTranscript for compatibility
        enhancedTranscript: transcription, // Will be same initially, user chooses on next screen
        duration: duration,
        timestamp: new Date().toISOString(),
        audioBlob: audioBlob,
        lessonOptions: lessonOptions,
        formattedContent: formattedContent,
        useEnhanced: false, // Default to original
      });

      console.log("[useQuickRecorder] NavCache populated with:", {
        hasTranscription: !!transcription,
        transcriptionLength: transcription.length,
        hasLessonOptions: !!lessonOptions,
        hasDuration: !!duration,
        hasAudioBlob: !!audioBlob,
      });

      // Cleanup sessionStorage
      sessionStorage.removeItem('hw_transcription_result');
      sessionStorage.removeItem('hw_transcription_error');

      // Cleanup and navigate - transcription ready!
      cleanup();
      router.push(`/review/book-style?nav=${navId}&mode=transcription-select`);
      options.onComplete?.();
      return;
    }

    // PATH B: Transcription not complete → Show processing, don't navigate yet
    console.log("[useQuickRecorder] PATH B: Transcription not ready, showing processing state");
    console.log("[useQuickRecorder] Duration:", duration, "TranscriptionStatus:", transcriptionStatus);
    setState("processing");

    // For recordings < 30s, start transcription now
    if (duration < 30 && transcriptionStatus === 'idle') {
      console.log("[useQuickRecorder] Starting transcription for short recording (<30s)...");
      setTranscriptionStatus('processing');

      // Start transcription API call (don't navigate, wait for completion)
      (async () => {
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const response = await fetch("/api/transcribe-assemblyai", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Transcription failed");
          }

          const data = await response.json();
          const transcription = data.transcription || "";

          console.log("[useQuickRecorder] Transcription complete:", transcription.substring(0, 100) + "...");

          // Set status to complete (this will trigger auto-navigation)
          setTranscriptionStatus('complete');

          // Store results
          sessionStorage.setItem('hw_transcription_result', JSON.stringify({
            transcription: transcription,
            lessonOptions: data.lessonOptions,
            formattedContent: data.formattedContent,
          }));

          console.log("[useQuickRecorder] Dispatching hw_transcription_complete event");

          // Dispatch event
          window.dispatchEvent(new CustomEvent('hw_transcription_complete', {
            detail: {
              transcription: transcription,
              lessonOptions: data.lessonOptions,
              formattedContent: data.formattedContent,
            }
          }));
        } catch (error) {
          console.error("[useQuickRecorder] Transcription error:", error);
          setTranscriptionStatus('error');
          sessionStorage.setItem('hw_transcription_error', 'true');
          window.dispatchEvent(new CustomEvent('hw_transcription_error'));

          // Show error toast
          toast({
            title: "Transcription failed",
            description: "Could not transcribe your recording. Please try again.",
            variant: "destructive",
          });

          // Return to review state
          setState("review");
        }
      })();
    }

    // For recordings >= 30s, transcription already running in background
    // Just wait for it to complete (status will change to 'complete')
    console.log("[useQuickRecorder] Waiting for transcription to complete (will auto-navigate)...");
  }, [audioBlob, duration, transcriptionStatus, state, router, cleanup, options, toast]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (state === "countdown" && countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Cancel any in-flight transcription
    if (transcriptionAbortControllerRef.current) {
      transcriptionAbortControllerRef.current.abort();
      transcriptionAbortControllerRef.current = null;
    }
    
    // Clear cached transcription results
    sessionStorage.removeItem('hw_transcription_result');
    sessionStorage.removeItem('hw_transcription_error');
    
    // Clean up audio review URL
    if (audioReviewUrl) {
      URL.revokeObjectURL(audioReviewUrl);
      setAudioReviewUrl(null);
    }
    
    cleanup();
    setDuration(0);
    setAudioBlob(null);
    setTranscriptionStatus('idle');
    setState("ready");
  }, [state, audioReviewUrl, cleanup]);

  // Re-record from review screen
  const reRecordFromReview = useCallback(() => {
    // CANCEL any in-flight transcription
    if (transcriptionAbortControllerRef.current) {
      transcriptionAbortControllerRef.current.abort();
      transcriptionAbortControllerRef.current = null;
      console.log("[useQuickRecorder] Cancelled in-flight transcription");
    }

    // Clear any cached transcription results
    sessionStorage.removeItem('hw_transcription_result');
    sessionStorage.removeItem('hw_transcription_error');

    // Reset transcription status
    setTranscriptionStatus('idle');

    // Clean up audio review
    if (audioReviewUrl) {
      URL.revokeObjectURL(audioReviewUrl);
      setAudioReviewUrl(null);
    }

    // Reset state
    setAudioBlob(null);
    setDuration(0);
    setState("ready");
  }, [audioReviewUrl]);

  return {
    state,
    duration,
    countdown,
    audioBlob,
    audioReviewUrl,
    transcriptionStatus,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    restartRecording,
    cancelRecording,
    continueFromReview,
    reRecordFromReview,
    maxDuration: MAX_RECORDING_DURATION,
  };
}
