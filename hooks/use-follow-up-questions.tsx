import { useState, useCallback, useRef } from "react";
import { type AudioRecorderHandle } from "@/components/AudioRecorder";
import { supabase } from "@/lib/supabase";
import { getApiUrl } from "@/lib/config";
import { toast } from "@/hooks/use-toast";

/**
 * Follow-up Questions Hook
 *
 * Reusable hook for generating contextual follow-up questions during recording.
 * Handles:
 * - Partial audio capture from AudioRecorder
 * - Quick transcription of partial audio via AssemblyAI
 * - AI-generated follow-up questions based on what user has said
 * - Question navigation (previous/next)
 * - Chunk tracking to avoid re-transcribing same audio
 *
 * Can be used by RecordModal, conversation mode, or Pearl interviewer.
 */

export interface UseFollowUpQuestionsOptions {
  audioRecorderRef: React.RefObject<AudioRecorderHandle | null>;
  onComplete?: (questions: string[]) => void;
  onError?: (error: Error) => void;
}

export function useFollowUpQuestions(options: UseFollowUpQuestionsOptions) {
  const { audioRecorderRef, onComplete, onError } = options;

  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState(0);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [transcribedChunkCount, setTranscribedChunkCount] = useState(0);

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
   * Generate follow-up questions based on current recording
   * This is called when user pauses for >30s or clicks "Get follow-up question"
   */
  const generateFollowUpQuestions = useCallback(async (currentPrompt?: string) => {
    if (!audioRecorderRef.current) {
      console.log("[useFollowUpQuestions] No audio recorder reference");
      return;
    }

    setIsGeneratingFollowUp(true);

    try {
      console.log("[useFollowUpQuestions] Getting partial recording...");

      // Wait a bit for any pending data to flush
      await new Promise(resolve => setTimeout(resolve, 200));

      // Get partial recording (all chunks recorded so far)
      const { blob, chunkCount } = audioRecorderRef.current.getCurrentPartialRecording() || { blob: null, chunkCount: 0 };

      console.log("[useFollowUpQuestions] Partial recording result:", {
        hasBlob: !!blob,
        blobSize: blob?.size,
        chunkCount,
      });

      if (!blob || blob.size === 0) {
        console.error("[useFollowUpQuestions] No audio data available");
        throw new Error("No audio data available. Please try recording for a bit longer, then pause, then request a follow-up.");
      }

      // Convert to base64
      console.log("[useFollowUpQuestions] Converting audio blob to base64...");
      const base64 = await blobToBase64(blob);

      // Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No authentication token");
      }

      // Transcribe partial audio using AssemblyAI
      console.log("[useFollowUpQuestions] Transcribing partial audio...");
      const transcribeResponse = await fetch(getApiUrl("/api/transcribe-assemblyai"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: blob.type || "audio/webm",
        }),
      });

      if (!transcribeResponse.ok) {
        throw new Error("Transcription failed");
      }

      const transcribeData = await transcribeResponse.json();
      const transcript = transcribeData.transcription || transcribeData.text || "";

      console.log("[useFollowUpQuestions] Partial transcription received:", {
        length: transcript.length,
        preview: transcript.substring(0, 100),
      });

      // Save partial transcript for reference
      setPartialTranscript(transcript);
      setTranscribedChunkCount(chunkCount);

      // Mark these chunks as transcribed in AudioRecorder
      audioRecorderRef.current?.markChunksAsTranscribed(chunkCount);

      // Generate 3 contextual follow-up questions
      console.log("[useFollowUpQuestions] Generating 3 follow-up questions...");
      const followUpResponse = await fetch("/api/followups/contextual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript,
          originalPrompt: currentPrompt || "",
        }),
      });

      if (!followUpResponse.ok) {
        throw new Error("Failed to generate follow-up questions");
      }

      const followUpData = await followUpResponse.json();
      const questions = followUpData.questions || [];

      console.log("[useFollowUpQuestions] Follow-up questions generated:", questions);

      // Set the questions
      setFollowUpQuestions(questions);
      setCurrentFollowUpIndex(0);

      toast({
        title: "Follow-up questions ready!",
        description: "Resume recording when you're ready to answer.",
      });

      onComplete?.(questions);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to generate follow-up questions");
      console.error("[useFollowUpQuestions] Error:", error);

      toast({
        title: "Couldn't generate question",
        description: error.message || "Try resuming and continuing your story.",
        variant: "destructive",
      });

      onError?.(error);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  }, [audioRecorderRef, blobToBase64, onComplete, onError]);

  /**
   * Navigate to next question
   */
  const nextQuestion = useCallback(() => {
    setCurrentFollowUpIndex((prev) => Math.min(followUpQuestions.length - 1, prev + 1));
  }, [followUpQuestions.length]);

  /**
   * Navigate to previous question
   */
  const prevQuestion = useCallback(() => {
    setCurrentFollowUpIndex((prev) => Math.max(0, prev - 1));
  }, []);

  /**
   * Clear all follow-up questions (e.g., when starting new recording)
   */
  const clearQuestions = useCallback(() => {
    setFollowUpQuestions([]);
    setCurrentFollowUpIndex(0);
    setPartialTranscript("");
    setTranscribedChunkCount(0);
  }, []);

  return {
    // State
    followUpQuestions,
    currentFollowUpIndex,
    isGeneratingFollowUp,
    partialTranscript,
    transcribedChunkCount,

    // Actions (memoized with useCallback per research)
    generateFollowUpQuestions,
    nextQuestion,
    prevQuestion,
    clearQuestions,
    setCurrentFollowUpIndex,
  };
}
