import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getApiUrl } from "@/lib/config";
import { toast } from "@/hooks/use-toast";

/**
 * Transcription Hook
 *
 * Reusable hook for audio transcription via AssemblyAI.
 * Handles:
 * - Foreground transcription (blocking)
 * - Background transcription (non-blocking with sessionStorage communication)
 * - Session management and retries
 * - Error handling
 *
 * Can be used by RecordModal, QuickStoryRecorder, or future features.
 */

export interface TranscriptionResult {
  transcription: string;
  formattedContent?: any;
  lessonOptions?: {
    practical?: string;
    emotional?: string;
    character?: string;
  };
}

export interface UseTranscriptionOptions {
  onComplete?: (result: TranscriptionResult) => void;
  onError?: (error: Error) => void;
}

export function useTranscription(options: UseTranscriptionOptions = {}) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [lessonOptions, setLessonOptions] = useState<TranscriptionResult["lessonOptions"] | null>(null);
  const [formattedContent, setFormattedContent] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get Supabase session with retry logic
   */
  const getSession = useCallback(async () => {
    let {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // If no session, try to refresh
    if (!session || sessionError) {
      console.log("[useTranscription] No session or error, attempting refresh...");
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshedSession) {
        session = refreshedSession;
        console.log("[useTranscription] Session refreshed successfully");
      } else {
        console.error("[useTranscription] Failed to refresh session:", refreshError);
        throw new Error("Authentication failed. Please sign in again.");
      }
    }

    if (!session?.access_token) {
      throw new Error("No authentication token. Please sign in again.");
    }

    return session;
  }, []);

  /**
   * Convert Blob to base64
   */
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  /**
   * Call AssemblyAI transcription API
   */
  const callTranscriptionAPI = useCallback(async (
    blob: Blob,
    sessionToken: string,
    title?: string
  ): Promise<TranscriptionResult> => {
    const base64 = await blobToBase64(blob);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    };

    const response = await fetch(getApiUrl("/api/transcribe-assemblyai"), {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        audioBase64: base64,
        mimeType: blob.type || "audio/webm",
        title: title || undefined,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please refresh the page and sign in again.");
      }
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      transcription: data.transcription || "",
      formattedContent: data.formattedContent,
      lessonOptions: data.lessonOptions,
    };
  }, [blobToBase64]);

  /**
   * Transcribe audio (foreground - blocking)
   * Used when immediate transcription is needed
   */
  const transcribeAudio = useCallback(async (
    blob: Blob,
    title?: string
  ): Promise<TranscriptionResult> => {
    console.log("[useTranscription] Starting foreground transcription");
    setIsTranscribing(true);
    setError(null);

    try {
      const session = await getSession();
      const result = await callTranscriptionAPI(blob, session.access_token, title);

      console.log("[useTranscription] Transcription completed:", {
        transcriptLength: result.transcription.length,
        hasLessonOptions: !!result.lessonOptions,
        hasFormattedContent: !!result.formattedContent,
      });

      setTranscription(result.transcription);
      setLessonOptions(result.lessonOptions || null);
      setFormattedContent(result.formattedContent || null);

      options.onComplete?.(result);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Transcription failed");
      console.error("[useTranscription] Error:", error);
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  }, [getSession, callTranscriptionAPI, options]);

  /**
   * Transcribe audio in background (non-blocking)
   * Used for audio review flow - transcribes while user adds metadata
   * Communicates results via sessionStorage and window events
   */
  const transcribeInBackground = useCallback(async (
    blob: Blob,
    title?: string
  ) => {
    console.log("[useTranscription] Starting background transcription");

    try {
      const session = await getSession();
      const result = await callTranscriptionAPI(blob, session.access_token, title);

      console.log("[useTranscription] Background transcription completed:", {
        transcriptLength: result.transcription.length,
        hasLessonOptions: !!result.lessonOptions,
      });

      // Store results for BookStyleReview to pick up
      sessionStorage.setItem('hw_transcription_result', JSON.stringify({
        transcription: result.transcription,
        lessonOptions: result.lessonOptions,
        formattedContent: result.formattedContent,
      }));

      // Dispatch custom event to notify BookStyleReview
      window.dispatchEvent(new CustomEvent('hw_transcription_complete', {
        detail: {
          transcription: result.transcription,
          lessonOptions: result.lessonOptions,
          formattedContent: result.formattedContent,
        }
      }));

      options.onComplete?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Background transcription failed");
      console.error("[useTranscription] Background transcription error:", error);

      // Store error state
      sessionStorage.setItem('hw_transcription_error', 'true');
      window.dispatchEvent(new CustomEvent('hw_transcription_error'));

      options.onError?.(error);
    }
  }, [getSession, callTranscriptionAPI, options]);

  return {
    // State
    isTranscribing,
    transcription,
    lessonOptions,
    formattedContent,
    error,

    // Actions (memoized with useCallback per research)
    transcribeAudio,
    transcribeInBackground,
  };
}
