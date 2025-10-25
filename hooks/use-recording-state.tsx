import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { type AudioRecorderHandle } from "@/components/AudioRecorder";
import { toast } from "@/hooks/use-toast";
import { useAIConsent } from "@/hooks/use-ai-consent";
import { supabase } from "@/lib/supabase";
import { useTranscription } from "./use-transcription";
import { useFollowUpQuestions } from "./use-follow-up-questions";

/**
 * Recording State Hook
 *
 * Main state management hook for RecordModal component.
 * Integrates transcription and follow-up question hooks.
 * Manages recording flow, audio review, and screen navigation.
 *
 * Pattern: Follows useQuickRecorder architecture
 * Size: ~280 lines (within maintainability guidelines)
 */

// Profile data type for narrowing
type ProfileData = {
  workEthic?: number;
  familyOrientation?: number;
  riskTolerance?: number;
  birthYear?: number;
};

export interface UseRecordingStateOptions {
  onSave: (recording: {
    audioBlob: Blob;
    transcription?: string;
    wisdomClip?: string;
    followUpQuestions?: string[];
    title?: string;
    year?: number;
    duration?: number;
    lessonOptions?: any;
    formattedContent?: any;
    wisdomClipText?: string;
  }) => void;
  initialPrompt?: string;
  initialTitle?: string;
  initialYear?: number;
}

export function useRecordingState(options: UseRecordingStateOptions) {
  const router = useRouter();
  const { isEnabled: isAIEnabled, isLoading: isAILoading } = useAIConsent();
  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Story metadata
  const [currentPrompt, setCurrentPrompt] = useState(options.initialPrompt || "");
  const [storyTitle, setStoryTitle] = useState(options.initialTitle || "");
  const [storyYear, setStoryYear] = useState<number | null>(options.initialYear || null);

  // Transcription state (from hook)
  const transcriptionHook = useTranscription({
    onComplete: (result) => {
      console.log("[useRecordingState] Transcription completed via hook:", result);
    },
  });

  // Follow-up questions state (from hook)
  const followUpHook = useFollowUpQuestions({
    audioRecorderRef,
    onComplete: (questions) => {
      console.log("[useRecordingState] Follow-up questions generated via hook:", questions);
    },
  });

  // Transcription review state
  const [showTranscription, setShowTranscription] = useState(false);
  const [editedTranscription, setEditedTranscription] = useState("");
  const [isTypingMode, setIsTypingMode] = useState(false);

  // Audio review screen state
  const [showAudioReview, setShowAudioReview] = useState(false);
  const [reviewAudioUrl, setReviewAudioUrl] = useState<string | null>(null);
  const [reviewAudioBlob, setReviewAudioBlob] = useState<Blob | null>(null);
  const [reviewDuration, setReviewDuration] = useState(0);

  // Go Deeper overlay state
  const [showGoDeeperOverlay, setShowGoDeeperOverlay] = useState(false);
  const [goDeeperQuestions, setGoDeeperQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Follow-up button visibility
  const [showFollowUpButton, setShowFollowUpButton] = useState(false);

  // Legacy state for backward compatibility
  const [allTranscriptions, setAllTranscriptions] = useState<string[]>([]);
  const [isContinuingRecording, setIsContinuingRecording] = useState(false);
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>([]);
  const [silenceTimer, setSilenceTimer] = useState(0);

  // Fetch personalized prompt based on profile
  const { data: profileData } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !options.initialPrompt,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Generate context-aware initial prompt
  useEffect(() => {
    if (!options.initialPrompt && profileData) {
      const profile = profileData as ProfileData;
      const prompts = [];

      if ((profile.workEthic ?? 0) > 7) {
        prompts.push(
          "Your profile shows you have a strong work ethic. Tell me about a time your dedication surprised even yourself.",
        );
      }

      if ((profile.familyOrientation ?? 0) > 7) {
        prompts.push(
          "Family seems important to you. What's a family memory that still makes you smile?",
        );
      }

      if ((profile.riskTolerance ?? 0) > 6) {
        prompts.push(
          "You seem comfortable with taking risks. What leap of faith changed your life?",
        );
      }

      const currentYear = new Date().getFullYear();
      const age = currentYear - (profile.birthYear ?? 1950);
      if (age > 70) {
        prompts.push(
          "With all your years of experience, what wisdom would you share with someone just starting out?",
        );
      }

      if (prompts.length === 0) {
        prompts.push(
          "Let's start with something meaningful to you. What story have you been wanting to share?",
        );
      }

      setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  }, [profileData, options.initialPrompt]);

  // Show follow-up button when paused > 30s
  useEffect(() => {
    if (isPaused && recordingTime >= 30) {
      setShowFollowUpButton(true);
    } else {
      setShowFollowUpButton(false);
    }
  }, [isPaused, recordingTime]);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    console.log("[useRecordingState] startRecording called");
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setFollowUpPrompts([]);
    followUpHook.clearQuestions();

    try {
      await audioRecorderRef.current?.startRecording();
      console.log("[useRecordingState] AudioRecorder started successfully");
    } catch (error) {
      console.error("[useRecordingState] Error starting AudioRecorder:", error);
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : "Could not start recording",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [followUpHook]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    console.log("[useRecordingState] pauseRecording called");
    setIsPaused(true);
    audioRecorderRef.current?.pauseRecording();
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    console.log("[useRecordingState] resumeRecording called");
    setIsPaused(false);
    audioRecorderRef.current?.resumeRecording();
  }, []);

  /**
   * Stop recording and show audio review screen
   */
  const stopRecording = useCallback(async () => {
    console.log("[useRecordingState] stopRecording called - showing audio review screen");

    const blob = audioRecorderRef.current?.getCurrentRecording();
    const duration = audioRecorderRef.current?.getRecordingDuration() || 0;

    console.log("[useRecordingState] Got current recording:", {
      hasBlob: !!blob,
      blobSize: blob?.size,
      duration
    });

    if (blob && blob.size > 0 && duration > 0) {
      const audioUrl = URL.createObjectURL(blob);

      setReviewAudioBlob(blob);
      setReviewAudioUrl(audioUrl);
      setReviewDuration(duration);

      setIsRecording(false);
      setIsPaused(false);
      setShowAudioReview(true);

      console.log("[useRecordingState] Audio review screen displayed");
    } else {
      console.error("[useRecordingState] No valid recording to process");
      toast({
        title: "No recording found",
        description: "Please try recording again.",
        variant: "destructive",
      });
      setIsRecording(false);
      setIsPaused(false);

      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup();
      }
    }
  }, []);

  /**
   * Re-record from audio review screen
   */
  const handleReRecord = useCallback(() => {
    console.log("[useRecordingState] Re-record requested");

    if (reviewAudioUrl) {
      URL.revokeObjectURL(reviewAudioUrl);
    }

    setShowAudioReview(false);
    setReviewAudioUrl(null);
    setReviewAudioBlob(null);
    setReviewDuration(0);

    setRecordingTime(0);
    followUpHook.clearQuestions();

    setIsRecording(true);
    setIsPaused(false);

    audioRecorderRef.current?.startRecording();
  }, [reviewAudioUrl, followUpHook]);

  /**
   * Continue from audio review - start background transcription and navigate
   */
  const handleContinueFromReview = useCallback(async () => {
    if (!reviewAudioBlob) {
      console.error("[useRecordingState] No audio blob to continue with");
      return;
    }

    console.log("[useRecordingState] Continue from audio review - starting background transcription");

    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }

    setShowAudioReview(false);

    // Start background transcription (non-blocking)
    transcriptionHook.transcribeInBackground(reviewAudioBlob, storyTitle || undefined);

    // Navigate to BookStyleReview immediately
    options.onSave({
      audioBlob: reviewAudioBlob,
      transcription: "", // Empty for now, will be updated via polling
      title: storyTitle || undefined,
      year: storyYear || undefined,
      duration: reviewDuration,
    });
  }, [reviewAudioBlob, storyTitle, storyYear, reviewDuration, transcriptionHook, options]);

  /**
   * Generate Go Deeper questions
   */
  const generateGoDeeperQuestions = useCallback(async (transcriptionText: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No auth session");
      }

      const response = await fetch("/api/followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transcription: transcriptionText }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      const questions = [
        data.followUps.emotional,
        data.followUps.wisdom,
        data.followUps.sensory,
      ];
      setGoDeeperQuestions(questions);
    } catch (error) {
      console.error("Error generating Go Deeper questions:", error);
      const questions = [
        "Can you tell me more about how that made you feel in that moment?",
        "What do you think that experience taught you about yourself?",
        "Looking back now, what impact did that have on your life?",
      ];
      setGoDeeperQuestions(questions);
    }
  }, []);

  /**
   * Toggle audio playback
   */
  const togglePlayback = useCallback(() => {
    if (!audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current?.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  /**
   * Save recording
   */
  const saveRecording = useCallback(() => {
    if (audioBlob) {
      options.onSave({
        audioBlob,
        transcription: editedTranscription || transcriptionHook.transcription,
        followUpQuestions: goDeeperQuestions,
        formattedContent: transcriptionHook.formattedContent,
        title: storyTitle || undefined,
        year: storyYear || undefined,
        duration: recordingTime || 0,
      });

      // Cleanup
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    }
  }, [audioBlob, editedTranscription, transcriptionHook.transcription, transcriptionHook.formattedContent, goDeeperQuestions, storyTitle, storyYear, recordingTime, audioUrl, options]);

  /**
   * Format time as MM:SS
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    // Refs
    audioRecorderRef,
    audioPlayerRef,

    // Screen state
    showAudioReview,
    showTranscription,
    showGoDeeperOverlay,

    // Recording state
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    isPlaying,

    // Story metadata
    currentPrompt,
    storyTitle,
    storyYear,
    setCurrentPrompt,
    setStoryTitle,
    setStoryYear,

    // Transcription (from hook)
    isTranscribing: transcriptionHook.isTranscribing,
    transcription: transcriptionHook.transcription,
    lessonOptions: transcriptionHook.lessonOptions,
    formattedContent: transcriptionHook.formattedContent,
    transcriptionError: transcriptionHook.error,

    // Transcription review
    editedTranscription,
    setEditedTranscription,
    isTypingMode,
    setIsTypingMode,
    setShowTranscription,

    // Follow-up questions (from hook)
    followUpQuestions: followUpHook.followUpQuestions,
    currentFollowUpIndex: followUpHook.currentFollowUpIndex,
    isGeneratingFollowUp: followUpHook.isGeneratingFollowUp,
    showFollowUpButton,

    // Audio review
    reviewAudioUrl,
    reviewDuration,

    // Go Deeper
    goDeeperQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    setShowGoDeeperOverlay,

    // AI consent
    isAIEnabled,
    isAILoading,

    // Actions (all memoized with useCallback)
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    handleReRecord,
    handleContinueFromReview,
    handleGetFollowUpQuestion: () => followUpHook.generateFollowUpQuestions(currentPrompt),
    setCurrentFollowUpIndex: followUpHook.setCurrentFollowUpIndex,
    generateGoDeeperQuestions,
    togglePlayback,
    saveRecording,
    formatTime,

    // Router
    router,
  };
}
