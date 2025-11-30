"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Sparkles,
  Camera,
  Edit2,
  Check,
  X,
  Plus,
  Mic,
  Upload,
  Trash2,
  Loader2,
  RotateCcw,
  Wand2,
  Undo2,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MultiPhotoUploader,
  type StoryPhoto,
} from "@/components/MultiPhotoUploader";
import { CustomAudioPlayer } from "@/components/CustomAudioPlayer";
import { AudioRecordingOverlay } from "@/components/AudioRecordingOverlay";
import { AudioProcessingCard } from "@/components/AudioProcessingCard";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type {
  AudioProcessingStatus,
  TranscriptionStatus,
  AudioSource,
} from "@/types/recording";

interface BookStyleReviewProps {
  title: string;
  storyYear: string;
  storyMonth?: string;
  storyDay?: string;
  transcription: string;
  photos: StoryPhoto[];
  wisdomText: string;
  audioUrl?: string | null;
  audioDuration?: number; // Duration in seconds
  onTitleChange: (title: string) => void;
  onYearChange: (year: string) => void;
  onMonthChange?: (month: string) => void;
  onDayChange?: (day: string) => void;
  onTranscriptionChange: (text: string) => void;
  onPhotosChange: (photos: StoryPhoto[]) => void;
  onWisdomChange: (wisdom: string) => void;
  onAudioChange?: (audioUrl: string | null, audioBlob?: Blob | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isEditing?: boolean;
  userBirthYear?: number;
  highlightDateField?: boolean;
}

export function BookStyleReview({
  title,
  storyYear,
  storyMonth = "",
  storyDay = "",
  transcription,
  photos,
  wisdomText,
  audioUrl,
  audioDuration,
  onTitleChange,
  onYearChange,
  onMonthChange,
  onDayChange,
  onTranscriptionChange,
  onPhotosChange,
  onWisdomChange,
  onAudioChange,
  onSave,
  onCancel,
  onDelete,
  isSaving = false,
  highlightDateField = false,
  isEditing = false,
  userBirthYear = 1950,
}: BookStyleReviewProps) {
  const [editingWisdom, setEditingWisdom] = useState(false);
  const [tempWisdom, setTempWisdom] = useState(wisdomText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [originalTranscription, setOriginalTranscription] = useState<string | null>(null);
  const [lessonOptions, setLessonOptions] = useState<{
    practical?: string;
    emotional?: string;
    character?: string;
  } | null>(null);
  const [showLessonOptions, setShowLessonOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveAudioConfirm, setShowRemoveAudioConfirm] = useState(false);
  const [removeAudioAction, setRemoveAudioAction] = useState<'remove' | 'rerecord'>('remove');

  // Transcription replacement confirmation
  const [showTranscriptionReplaceConfirm, setShowTranscriptionReplaceConfirm] = useState(false);
  const [pendingTranscription, setPendingTranscription] = useState<string>("");
  const [pendingLessonOptions, setPendingLessonOptions] = useState<{
    practical?: string;
    emotional?: string;
    character?: string;
  } | null>(null);
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const [pendingAudioDuration, setPendingAudioDuration] = useState<number>(0);

  // Recording overlay state
  const [showRecordingOverlay, setShowRecordingOverlay] = useState(false);
  const [hasExistingRecording, setHasExistingRecording] = useState(false);

  // Processing states
  const [audioProcessingStatus, setAudioProcessingStatus] =
    useState<AudioProcessingStatus>("idle");
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<TranscriptionStatus>("idle");
  const [cleanedAudioUrl, setCleanedAudioUrl] = useState<string | null>(
    audioUrl || null
  );
  const [audioSource, setAudioSource] = useState<AudioSource>("original");
  const [processingError, setProcessingError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const wisdomInputRef = useRef<HTMLTextAreaElement>(null);


  // Calculate age at time of story
  const age = storyYear ? parseInt(storyYear) - userBirthYear : null;

  // Focus input when editing starts
  useEffect(() => {
    if (editingWisdom && wisdomInputRef.current) {
      wisdomInputRef.current.focus();
      wisdomInputRef.current.select();
    }
  }, [editingWisdom]);

  // Track if this is the initial automatic show
  const [isInitialRecordingShow, setIsInitialRecordingShow] = useState(false);

  // Sync audioUrl to cleanedAudioUrl (especially important for edit mode)
  useEffect(() => {
    if (audioUrl) {
      setCleanedAudioUrl(audioUrl);
      setHasExistingRecording(true);
    } else {
      // Clear cleanedAudioUrl when audioUrl is removed
      setCleanedAudioUrl(null);
      setHasExistingRecording(false);
    }
  }, [audioUrl]);

  // Check for recording overlay on mount (only once)
  useEffect(() => {
    const isDraft = searchParams?.get("draft") === "true";
    const isNew = searchParams?.get("new") === "true";

    // Only show overlay if we don't already have a recording
    if ((isNew || (isDraft && !audioUrl)) && !cleanedAudioUrl) {
      setShowRecordingOverlay(true);
      setIsInitialRecordingShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only run when searchParams change, not audioUrl

  // Note: Background transcription logic removed - users now select transcription
  // BEFORE reaching this screen via TranscriptionSelectionScreen component

  const handleContinueRecording = async (
    audioBlob: Blob,
    duration: number,
    newTranscription?: string,
    newLessonOptions?: { practical?: string; emotional?: string; character?: string }
  ) => {
    // Close overlay
    setShowRecordingOverlay(false);
    setIsInitialRecordingShow(false); // No longer initial show

    // Create blob URL for audio playback
    const blobUrl = URL.createObjectURL(audioBlob);

    // Update audio state
    setCleanedAudioUrl(blobUrl);
    setAudioSource("original");
    setAudioProcessingStatus("complete");

    // Call the parent callback with audio URL and blob
    if (onAudioChange) {
      onAudioChange(blobUrl, audioBlob);
    }

    setTranscriptionStatus("complete");
    setProcessingError(null);

    // Check if there's existing transcription text
    const hasExistingText = transcription && transcription.trim().length > 0;

    if (hasExistingText && newTranscription) {
      // Store the new transcription and show confirmation modal
      setPendingTranscription(newTranscription);
      setPendingLessonOptions(newLessonOptions || null);
      setPendingAudioUrl(blobUrl);
      setPendingAudioBlob(audioBlob);
      setPendingAudioDuration(duration);
      setShowTranscriptionReplaceConfirm(true);
    } else if (newTranscription) {
      // No existing text, apply transcription directly
      onTranscriptionChange(newTranscription);

      // Update lessons
      if (newLessonOptions) {
        setLessonOptions(newLessonOptions);
        // Set default lesson (practical)
        if (newLessonOptions.practical) {
          onWisdomChange(newLessonOptions.practical);
          setTempWisdom(newLessonOptions.practical);
        }
      }

      toast({
        title: "Recording processed!",
        description: "Your memory has been transcribed.",
      });
    } else {
      // No transcription provided (maybe transcription failed), just save the audio
      toast({
        title: "Recording saved!",
        description: "Audio recorded successfully.",
      });
    }
  };

  const handleReRecord = () => {
    setShowRecordingOverlay(true);
    setIsInitialRecordingShow(false); // This is a manual re-record, not initial
  };

  const handleRecordingOverlayClose = () => {
    setShowRecordingOverlay(false);

    // If this was the initial automatic show (new/draft without audio),
    // and user cancels, navigate back
    if (isInitialRecordingShow && !hasExistingRecording) {
      setIsInitialRecordingShow(false);
      onCancel();
    }
  };

  const handleWisdomSave = () => {
    onWisdomChange(tempWisdom);
    setEditingWisdom(false);
  };

  const handleEnhanceStory = async () => {
    if (!transcription?.trim()) {
      toast({
        title: "No story to enhance",
        description: "Please write your story first before enhancing it.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      // Save original before enhancing
      setOriginalTranscription(transcription);

      const currentWordCount = transcription.split(" ").filter(w => w.length > 0).length;

      const response = await fetch("/api/stories/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: transcription,
          title: title,
          year: storyYear,
          currentWordCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enhance story");
      }

      const data = await response.json();

      onTranscriptionChange(data.enhancedStory);

      toast({
        title: "✨ Story enhanced!",
        description: `Expanded from ${data.meta.originalWordCount} to ${data.meta.enhancedWordCount} words. Click Undo if you want to revert.`,
      });
    } catch (error) {
      console.error("Enhancement error:", error);
      toast({
        title: "Enhancement failed",
        description: "Please try again or continue editing manually.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoEnhancement = () => {
    if (originalTranscription) {
      onTranscriptionChange(originalTranscription);
      setOriginalTranscription(null);
      toast({
        title: "Reverted to original",
        description: "Your original story has been restored.",
      });
    }
  };

  const handleGenerateLesson = async () => {
    if (!transcription?.trim()) {
      toast({
        title: "No story yet",
        description: "Please write your story first before generating lessons.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingLesson(true);
    try {
      const response = await fetch("/api/stories/suggest-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: transcription,
          title: title,
          year: storyYear,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate lessons");
      }

      const data = await response.json();
      setLessonOptions(data.lessons);
      setShowLessonOptions(true);
    } catch (error) {
      console.error("Lesson generation error:", error);
      toast({
        title: "Generation failed",
        description: "Please try again or write your own lesson.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleSelectLesson = (lesson: string) => {
    onWisdomChange(lesson);
    setTempWisdom(lesson);
    setShowLessonOptions(false);
    setEditingWisdom(false);
    toast({
      title: "Lesson added",
      description: "You can still edit it if you'd like.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2c2416] via-[#1a1410] to-[#2c2416] md:bg-gradient-to-b md:from-amber-50 md:to-white overflow-x-hidden">
      {/* Recording Overlay - Uses AudioRecordingScreen with 30-min max, immediate transcription */}
      <AudioRecordingOverlay
        isOpen={showRecordingOverlay}
        onClose={handleRecordingOverlayClose}
        onContinue={handleContinueRecording}
        existingAudioUrl={cleanedAudioUrl || undefined}
      />

      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-[#8B6F47]/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-serif text-gray-800">
            Review Memory
          </h1>
          <Button
            type="button"
            onClick={() => {
              console.log("BookStyleReview: Top Save button clicked, calling onSave");
              onSave();
            }}
            disabled={isSaving}
            className="bg-[#203954] hover:bg-[#1B3047] text-white rounded-xl px-6 py-2 text-base font-medium shadow-md transition-all active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>

      {/* Single Page Book View */}
      <div className="flex justify-center px-2 py-4 pb-16 md:px-4 md:py-8">
        {/* Desktop: Wrap in brown leather border like book */}
        <div className="w-full max-w-3xl md:bg-[#2c2416] md:p-8 md:rounded-xl md:shadow-[inset_0_0_40px_rgba(0,0,0,0.4),0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* Page content - cream background like book pages */}
          <div className="bg-[#faf8f5] rounded-lg shadow-[0_2px_12px_rgba(139,111,71,0.15)] md:shadow-[0_0_40px_rgba(0,0,0,0.1)_inset,0_0_2px_rgba(0,0,0,0.1)]">
            <div className="p-6 md:p-12 space-y-8">
              {/* Audio Processing Card - Only show during active processing */}
              {audioProcessingStatus !== "idle" && audioProcessingStatus !== "complete" && (
                <AudioProcessingCard
                  status={audioProcessingStatus}
                  audioUrl={cleanedAudioUrl}
                  audioSource={audioSource}
                  error={processingError}
                />
              )}

              {/* Re-record button for existing recordings */}
              {hasExistingRecording &&
                audioProcessingStatus === "complete" &&
                cleanedAudioUrl && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleReRecord}
                      variant="outline"
                      size="sm"
                      className="border-[#E8DDD3] text-[#8B7355] hover:bg-[#FAF8F6]"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-record
                    </Button>
                  </div>
                )}

              {/* 1. Photo Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photos (Optional)
                </h3>
                <MultiPhotoUploader
                  photos={photos}
                  onPhotosChange={onPhotosChange}
                  disabled={false}
                  loading={false}
                />
              </div>

              {/* 2. Title - Always Visible Input with Border */}
              <div className="group relative">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Story Title
                </label>
                <div className="border-2 border-gray-300 rounded-lg px-4 py-3 focus-within:border-[#8b6b7a] focus-within:ring-2 focus-within:ring-[#8b6b7a]/20 transition-all">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="w-full text-2xl font-serif text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                    placeholder="Story title"
                  />
                </div>
              </div>

              {/* 3. Date - Always Visible with Year, Month, Day */}
              <div className="group relative">
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Story Date
                </label>
                <div className="flex gap-2 md:gap-3 items-center">
                  {/* Year Selector */}
                  <div className={`border-2 rounded-lg transition-all ${
                    highlightDateField
                      ? "border-red-500 ring-2 ring-red-500/20 animate-pulse"
                      : "border-gray-300 focus-within:border-[#8b6b7a] focus-within:ring-2 focus-within:ring-[#8b6b7a]/20"
                  }`}>
                    <select
                      value={storyYear}
                      onChange={(e) => onYearChange(e.target.value)}
                      className="px-2 md:px-4 py-3 text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 rounded-lg cursor-pointer"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Month Input */}
                  <div className="border-2 border-gray-300 rounded-lg focus-within:border-[#8b6b7a] focus-within:ring-2 focus-within:ring-[#8b6b7a]/20 transition-all flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Month"
                      value={storyMonth}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only digits
                        if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                          onMonthChange?.(value);
                        }
                      }}
                      className="w-16 md:w-24 px-2 md:px-4 py-3 text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 rounded-lg"
                      maxLength={2}
                    />
                  </div>

                  {/* Day Input */}
                  <div className="border-2 border-gray-300 rounded-lg focus-within:border-[#8b6b7a] focus-within:ring-2 focus-within:ring-[#8b6b7a]/20 transition-all flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Day"
                      value={storyDay}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only digits
                        if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                          onDayChange?.(value);
                        }
                      }}
                      className="w-14 md:w-20 px-2 md:px-4 py-3 text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 rounded-lg"
                      maxLength={2}
                    />
                  </div>
                </div>
                {storyYear && age !== null && (
                  <p className="text-sm text-gray-500 mt-2">
                    {age === 0 && "Birth year"}
                    {age > 0 && `You were ${age} years old`}
                    {age < 0 && "Before you were born"}
                  </p>
                )}
              </div>

              {/* 4. Audio Recording - Compact Horizontal Layout */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Audio (Optional)
                </h3>
                {audioUrl ? (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <CustomAudioPlayer
                      src={audioUrl}
                      knownDuration={audioDuration}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRemoveAudioAction('rerecord');
                          setShowRemoveAudioConfirm(true);
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Re-record
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRemoveAudioAction('remove');
                          setShowRemoveAudioConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 text-coral-500 animate-spin flex-shrink-0" />
                      <p className="text-sm text-gray-600">Processing audio...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsInitialRecordingShow(false);
                        setShowRecordingOverlay(true);
                      }}
                      className="flex items-center gap-1.5 h-9"
                    >
                      <Mic className="w-4 h-4" />
                      Record
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "audio/*";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            setIsProcessing(true);

                            const audioUrl = URL.createObjectURL(file);
                            const hasExistingText = transcription && transcription.trim().length > 0;

                            // Transcribe the audio
                            const formData = new FormData();
                            formData.append("audio", file);

                            try {
                              const { supabase } = await import(
                                "@/lib/supabase"
                              );
                              const {
                                data: { session },
                              } = await supabase.auth.getSession();

                              // Get CSRF token
                              const csrfResponse = await fetch("/api/csrf");
                              const { token: csrfToken } = await csrfResponse.json();

                              const headers: HeadersInit = {
                                "x-csrf-token": csrfToken,
                              };
                              if (session?.access_token) {
                                headers["Authorization"] =
                                  `Bearer ${session.access_token}`;
                              }

                              const response = await fetch(
                                "/api/transcribe",
                                {
                                  method: "POST",
                                  headers,
                                  body: formData,
                                },
                              );

                              if (response.ok) {
                                const data = await response.json();

                                if (hasExistingText && data.transcription) {
                                  // Store pending data and show confirmation
                                  setPendingTranscription(data.transcription);
                                  setPendingLessonOptions(data.lessonOptions || null);
                                  setPendingAudioUrl(audioUrl);
                                  setPendingAudioBlob(file);
                                  setPendingAudioDuration(0); // Duration not available from upload
                                  onAudioChange?.(audioUrl, file);
                                  setShowTranscriptionReplaceConfirm(true);
                                } else {
                                  // No existing text or no transcription, apply directly
                                  onAudioChange?.(audioUrl, file);

                                  if (data.transcription) {
                                    onTranscriptionChange(data.transcription);
                                  }
                                  // Use practical lesson as default (user can edit later)
                                  if (data.lessonOptions?.practical) {
                                    onWisdomChange(
                                      data.lessonOptions.practical,
                                    );
                                  }
                                }
                              } else {
                                toast({
                                  title: "Transcription failed",
                                  description: "Could not transcribe the audio. The audio file will still be saved.",
                                  variant: "destructive",
                                });
                                // Still set the audio even if transcription failed
                                onAudioChange?.(audioUrl, file);
                              }
                            } catch {
                              toast({
                                title: "Error",
                                description: "An error occurred while processing the audio. The audio file will still be saved.",
                                variant: "destructive",
                              });
                              // Still set the audio even if error
                              onAudioChange?.(audioUrl, file);
                            } finally {
                              setIsProcessing(false);
                            }
                          }
                        };

                        // Append to DOM and trigger synchronously
                        input.style.display = "none";
                        document.body.appendChild(input);
                        input.click();

                        // Clean up after a delay
                        setTimeout(() => {
                          if (document.body.contains(input)) {
                            document.body.removeChild(input);
                          }
                        }, 1000);
                      }}
                      className="flex items-center gap-1.5 h-9"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                  </div>
                )}
              </div>

              {/* 5. Your Story */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-700">
                    Your Story
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Desktop: Show both buttons when originalTranscription exists */}
                    {originalTranscription && (
                      <Button
                        type="button"
                        onClick={handleUndoEnhancement}
                        disabled={isEnhancing}
                        size="sm"
                        variant="outline"
                        className="hidden md:flex text-gray-600 hover:text-gray-900"
                      >
                        <Undo2 className="w-4 h-4 mr-1.5" />
                        Undo Enhancement
                      </Button>
                    )}

                    {/* Mobile: Show "Undo" when originalTranscription exists, otherwise show "Enhance Story" */}
                    {/* Desktop: Always show "Enhance Story" */}
                    {originalTranscription ? (
                      <Button
                        type="button"
                        onClick={handleUndoEnhancement}
                        disabled={isEnhancing}
                        size="sm"
                        variant="outline"
                        className="md:hidden text-gray-600 hover:text-gray-900"
                      >
                        <Undo2 className="w-4 h-4 mr-1.5" />
                        Undo
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleEnhanceStory}
                        disabled={isEnhancing || !transcription?.trim()}
                        size="sm"
                        variant="outline"
                        className="md:hidden text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                      >
                        {isEnhancing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            Enhancing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-1.5" />
                            Enhance Story
                          </>
                        )}
                      </Button>
                    )}

                    {/* Desktop only: Always show Enhance Story button */}
                    <Button
                      type="button"
                      onClick={handleEnhanceStory}
                      disabled={isEnhancing || !transcription?.trim()}
                      size="sm"
                      variant="outline"
                      className="hidden md:flex text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                    >
                      {isEnhancing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-1.5" />
                          Enhance Story
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Processing Status */}
                {transcriptionStatus !== "idle" &&
                  transcriptionStatus !== "complete" &&
                  transcriptionStatus !== "error" && (
                    <div className="mb-4">
                      <ProcessingStatus
                        status={transcriptionStatus}
                        type="transcription"
                      />
                    </div>
                  )}

                {/* Transcription textarea */}
                <Textarea
                  value={transcription}
                  onChange={(e) => onTranscriptionChange(e.target.value)}
                  className={cn(
                    "w-full min-h-[300px] resize-none bg-white border-gray-300 rounded-lg p-4 text-gray-800 leading-relaxed font-serif text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400",
                    (transcriptionStatus !== "complete" &&
                      transcriptionStatus !== "idle") &&
                    "opacity-60 cursor-not-allowed"
                  )}
                  placeholder={
                    transcriptionStatus === "transcribing"
                      ? "Transcribing your story..."
                      : transcriptionStatus === "extracting"
                        ? "Extracting insights..."
                        : "Type or paste your story here. This is how it will appear in your book..."
                  }
                  disabled={
                    isEnhancing ||
                    (transcriptionStatus !== "complete" &&
                      transcriptionStatus !== "idle")
                  }
                />

                {transcription && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-base text-gray-500">
                      {
                        transcription.split(" ").filter((w) => w.length > 0)
                          .length
                      }{" "}
                      words
                    </p>
                    {isEnhancing && (
                      <p className="text-base text-purple-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Heritage Whisper Storyteller enhancing your story...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Lesson Learned */}
              <div>
                <div className="group relative">
                  {/* Centered Heading */}
                  <h3 className="text-lg font-medium text-gray-700 flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Lesson Learned
                  </h3>

                  {/* Centered Button */}
                  <div className="flex justify-center mb-3">
                    <Button
                      type="button"
                      onClick={handleGenerateLesson}
                      disabled={isGeneratingLesson || !transcription?.trim()}
                      size="sm"
                      variant="outline"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                    >
                      {isGeneratingLesson ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-4 h-4 mr-1.5" />
                          {wisdomText ? "Get Another Recommendation" : "Need a Recommendation?"}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Lesson Options Display */}
                  {showLessonOptions && lessonOptions && (
                    <div className="mb-4 space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Choose a lesson or edit it:</p>
                      {lessonOptions.practical && (
                        <button
                          onClick={() => handleSelectLesson(lessonOptions.practical!)}
                          className="w-full text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <p className="text-xs text-blue-600 font-medium mb-1">Practical</p>
                          <p className="text-base text-gray-700">{lessonOptions.practical}</p>
                        </button>
                      )}
                      {lessonOptions.emotional && (
                        <button
                          onClick={() => handleSelectLesson(lessonOptions.emotional!)}
                          className="w-full text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <p className="text-xs text-blue-600 font-medium mb-1">Emotional</p>
                          <p className="text-base text-gray-700">{lessonOptions.emotional}</p>
                        </button>
                      )}
                      {lessonOptions.character && (
                        <button
                          onClick={() => handleSelectLesson(lessonOptions.character!)}
                          className="w-full text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <p className="text-xs text-blue-600 font-medium mb-1">Character</p>
                          <p className="text-base text-gray-700">{lessonOptions.character}</p>
                        </button>
                      )}
                      <Button
                        type="button"
                        onClick={() => setShowLessonOptions(false)}
                        size="sm"
                        variant="ghost"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {!editingWisdom ? (
                    <div
                      className="wisdom-quote relative p-6 clear-both cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setTempWisdom(wisdomText);
                        setEditingWisdom(true);
                      }}
                      style={{
                        background: '#FFFFFF',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #E0E0E0 31px, #E0E0E0 32px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        border: '1px solid #D0D0D0',
                        paddingTop: '40px',
                      }}
                    >
                      {/* Red vertical margin line (like notebook paper) */}
                      <div
                        className="absolute top-0 left-8 bottom-0 w-[2px] pointer-events-none"
                        style={{
                          background: '#FF6B6B',
                          opacity: 0.3,
                        }}
                      ></div>

                      <p
                        className="text-sm mb-2 relative z-10 pl-6"
                        style={{
                          fontFamily: '"Caveat", cursive',
                          fontSize: '18px',
                          color: '#8b6b7a',
                          fontWeight: 600,
                          lineHeight: '32px',
                        }}
                      >
                        Lesson Learned
                      </p>
                      <p
                        className="relative z-10 pl-6"
                        style={{
                          fontFamily: '"Caveat", cursive',
                          fontSize: '22px',
                          color: '#2c2c2c',
                          lineHeight: '32px',
                        }}
                      >
                        {wisdomText ||
                          "Click to add a lesson or wisdom from this memory..."}
                      </p>
                      <div className="flex items-center gap-2 mt-4 relative z-10 pl-6">
                        <Edit2 className="w-4 h-4 text-gray-400" />
                        {wisdomText && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering edit mode
                              onWisdomChange("");
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        ref={wisdomInputRef}
                        value={tempWisdom}
                        onChange={(e) => setTempWisdom(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setTempWisdom(wisdomText);
                            setEditingWisdom(false);
                          }
                        }}
                        className="min-h-[100px]"
                        placeholder="What lesson or wisdom would you share from this memory?"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleWisdomSave}
                          className="text-green-600"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onWisdomChange("");
                            setTempWisdom("");
                            setEditingWisdom(false);
                          }}
                          className="text-amber-600"
                        >
                          Remove
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTempWisdom(wisdomText);
                            setEditingWisdom(false);
                          }}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className={`grid gap-3 ${isEditing && onDelete ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {/* Delete button - only shown when editing */}
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
              className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-2 border-red-200 hover:border-red-300 rounded-2xl py-6 text-lg font-medium transition-all active:scale-[0.99]"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          )}

          {/* Save Memory button */}
          <Button
            type="button"
            onClick={() => {
              console.log(
                "BookStyleReview: Bottom Save button clicked, calling onSave",
              );
              onSave();
            }}
            disabled={isSaving}
            className="bg-[#203954] hover:bg-[#1B3047] text-white rounded-2xl py-6 text-lg font-medium shadow-lg shadow-blue-900/10 transition-all active:scale-[0.99]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Memory"
            )}
          </Button>

          {/* Cancel button */}
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="bg-white hover:bg-gray-50 text-[#203954] border-2 border-[#E5E7EB] rounded-2xl py-6 text-lg font-medium transition-all active:scale-[0.99]"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Transcription Replacement Confirmation Modal */}
      <div className={showTranscriptionReplaceConfirm ? "block" : "hidden"}>
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            {/* Content */}
            <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Replace Story Text?
              </h2>

              {/* Message */}
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed whitespace-pre-line">
                You have existing story text. Would you like to replace it with the new transcription from this audio?
              </p>
            </div>

            {/* Buttons */}
            <div className="bg-gray-50 px-6 sm:px-8 py-4 sm:py-5 rounded-b-2xl flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowTranscriptionReplaceConfirm(false);
                  // Keep current text and lesson, audio already set
                  toast({
                    title: "Audio updated",
                    description: "Your audio has been updated. Story text remains unchanged.",
                  });
                  // Clear pending data
                  setPendingTranscription("");
                  setPendingLessonOptions(null);
                  setPendingAudioUrl(null);
                  setPendingAudioBlob(null);
                }}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl border-2 border-gray-300 text-base sm:text-lg transition-all"
              >
                Keep Current Text
              </button>
              <button
                onClick={() => {
                  setShowTranscriptionReplaceConfirm(false);
                  // Apply new transcription, keep old lesson
                  onTranscriptionChange(pendingTranscription);

                  // Note: Keep the old lesson as per user requirement (2a)
                  // Only update if there was no lesson before
                  if (!wisdomText && pendingLessonOptions?.practical) {
                    onWisdomChange(pendingLessonOptions.practical);
                    setTempWisdom(pendingLessonOptions.practical);
                  }

                  toast({
                    title: "Story updated!",
                    description: "Your story has been replaced with the new transcription.",
                  });

                  // Clear pending data
                  setPendingTranscription("");
                  setPendingLessonOptions(null);
                  setPendingAudioUrl(null);
                  setPendingAudioBlob(null);
                }}
                className="flex-1 font-semibold px-6 py-3 rounded-xl text-base sm:text-lg transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                Use New Transcription
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Audio Confirmation Modal */}
      <div className={showRemoveAudioConfirm ? "block" : "hidden"}>
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            {/* Content */}
            <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                {removeAudioAction === 'rerecord' ? 'Re-record Your Memory?' : 'Remove Audio Recording?'}
              </h2>

              {/* Message */}
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed whitespace-pre-line">
                {removeAudioAction === 'rerecord'
                  ? 'This will replace your current audio recording with a new one.'
                  : 'This will remove the audio recording from this memory. Your story text and photos will remain unchanged.'}
              </p>
            </div>

            {/* Buttons */}
            <div className="bg-gray-50 px-6 sm:px-8 py-4 sm:py-5 rounded-b-2xl flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowRemoveAudioConfirm(false)}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl border-2 border-gray-300 text-base sm:text-lg transition-all"
              >
                Keep Audio
              </button>
              <button
                onClick={() => {
                  setShowRemoveAudioConfirm(false);
                  onAudioChange?.(null, null);
                  if (removeAudioAction === 'rerecord') {
                    setIsInitialRecordingShow(false);
                    setShowRecordingOverlay(true);
                  }
                }}
                className="flex-1 font-semibold px-6 py-3 rounded-xl text-base sm:text-lg transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                {removeAudioAction === 'rerecord' ? 'Yes, Re-record' : 'Remove Audio'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {onDelete && (
        <div className={showDeleteConfirm ? "block" : "hidden"}>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              }}
            >
              {/* Content */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Delete Memory?
                </h2>

                {/* Message */}
                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed whitespace-pre-line">
                  Are you sure you want to delete this memory? This action cannot be undone.
                </p>
              </div>

              {/* Buttons */}
              <div className="bg-gray-50 px-6 sm:px-8 py-4 sm:py-5 rounded-b-2xl flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl border-2 border-gray-300 text-base sm:text-lg transition-all"
                >
                  Keep Memory
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                  className="flex-1 font-semibold px-6 py-3 rounded-xl text-base sm:text-lg transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookStyleReview;
