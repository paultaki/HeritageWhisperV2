"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { AudioRecorder, AudioRecorderHandle } from "@/components/AudioRecorder";
import { CustomAudioPlayer } from "@/components/CustomAudioPlayer";
import { VoiceRecordingButton } from "@/components/VoiceRecordingButton";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface BookStyleReviewProps {
  title: string;
  storyYear: string;
  transcription: string;
  photos: StoryPhoto[];
  wisdomText: string;
  audioUrl?: string | null;
  audioDuration?: number; // Duration in seconds
  onTitleChange: (title: string) => void;
  onYearChange: (year: string) => void;
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
}

export function BookStyleReview({
  title,
  storyYear,
  transcription,
  photos,
  wisdomText,
  audioUrl,
  audioDuration,
  onTitleChange,
  onYearChange,
  onTranscriptionChange,
  onPhotosChange,
  onWisdomChange,
  onAudioChange,
  onSave,
  onCancel,
  onDelete,
  isSaving = false,
  isEditing = false,
  userBirthYear = 1950,
}: BookStyleReviewProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingYear, setEditingYear] = useState(false);
  const [editingWisdom, setEditingWisdom] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempYear, setTempYear] = useState(storyYear);
  const [tempWisdom, setTempWisdom] = useState(wisdomText);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [originalTranscription, setOriginalTranscription] = useState<string | null>(null);
  const [lessonOptions, setLessonOptions] = useState<{
    practical?: string;
    emotional?: string;
    character?: string;
  } | null>(null);
  const [showLessonOptions, setShowLessonOptions] = useState(false);

  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const wisdomInputRef = useRef<HTMLTextAreaElement>(null);

  // Recording timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused]);

  // Calculate age at time of story
  const age = storyYear ? parseInt(storyYear) - userBirthYear : null;

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingYear && yearInputRef.current) {
      yearInputRef.current.focus();
      yearInputRef.current.select();
    }
  }, [editingYear]);

  useEffect(() => {
    if (editingWisdom && wisdomInputRef.current) {
      wisdomInputRef.current.focus();
      wisdomInputRef.current.select();
    }
  }, [editingWisdom]);

  const handleTitleSave = () => {
    onTitleChange(tempTitle);
    setEditingTitle(false);
  };

  const handleYearSave = () => {
    onYearChange(tempYear);
    setEditingYear(false);
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
    <div className="min-h-screen bg-gradient-to-b from-[#2c2416] via-[#1a1410] to-[#2c2416] md:bg-gradient-to-b md:from-amber-50 md:to-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-[#8B6F47]/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-serif text-gray-800 flex-shrink-0">
            Review Memory
          </h1>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-full px-6 py-6 text-lg ml-auto mr-12 md:mr-20 2xl:mr-0"
          >
            Cancel
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

              {/* 2. Title - Inline Editable */}
              <div className="group relative">
                {!editingTitle ? (
                  <h2
                    className="memory-title text-5xl font-serif text-gray-900 cursor-pointer hover:bg-amber-50 rounded px-3 -mx-3 py-2 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setTempTitle(title);
                      setEditingTitle(true);
                    }}
                  >
                    {title || "Click to add title"}
                    <Edit2 className="w-6 h-6 text-gray-400" />
                  </h2>
                ) : (
                  <Input
                    ref={titleInputRef}
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setTempTitle(title);
                        setEditingTitle(false);
                      }
                    }}
                    className="text-5xl font-serif"
                    placeholder="Give your memory a title..."
                  />
                )}
              </div>

              {/* 3. Date - Inline Editable */}
              <div className="group relative">
                {!editingYear ? (
                  <p
                    className="text-xl text-gray-600 cursor-pointer hover:bg-amber-50 rounded px-3 -mx-3 py-1 transition-colors inline-flex items-center gap-2"
                    onClick={() => {
                      setTempYear(storyYear);
                      setEditingYear(true);
                    }}
                  >
                    <Calendar className="w-6 h-6" />
                    {storyYear || "Add year"}
                    {age !== null && age > 0 && ` • Age ${age}`}
                    {age !== null && age === 0 && ` • Birth`}
                    {age !== null && age < 0 && ` • Before birth`}
                    <Edit2 className="w-5 h-5 text-gray-400" />
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-gray-600" />
                    <Input
                      ref={yearInputRef}
                      type="number"
                      value={tempYear}
                      onChange={(e) => setTempYear(e.target.value)}
                      onBlur={handleYearSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleYearSave();
                        if (e.key === "Escape") {
                          setTempYear(storyYear);
                          setEditingYear(false);
                        }
                      }}
                      className="w-32 text-xl"
                      placeholder="Year"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                )}
              </div>

              {/* 4. Audio Recording */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Audio Recording (Optional)
                </h3>
                {audioUrl ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <CustomAudioPlayer 
                      src={audioUrl} 
                      knownDuration={audioDuration} 
                      className="mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to re-record? This will replace your current audio.",
                            )
                          ) {
                            onAudioChange?.(null, null);
                            setIsRecording(true);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Re-record
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to remove this audio?",
                            )
                          ) {
                            onAudioChange?.(null, null);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove Audio
                      </Button>
                    </div>
                  </div>
                ) : isRecording ? (
                  <div className="p-8 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg border-2 border-orange-200">
                    {/* Hidden AudioRecorder for actual recording logic */}
                    <div className="hidden">
                      <AudioRecorder
                        ref={audioRecorderRef}
                        onRecordingComplete={async (audioBlob) => {
                          setIsRecording(false);
                          setIsPaused(false);
                          setRecordingTime(0);
                          setIsProcessing(true);

                          const audioUrl = URL.createObjectURL(audioBlob);
                          onAudioChange?.(audioUrl, audioBlob);

                          // Transcribe the audio
                          const formData = new FormData();
                          formData.append("audio", audioBlob);

                          try {
                            const { supabase } = await import("@/lib/supabase");
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

                            const response = await fetch("/api/transcribe", {
                              method: "POST",
                              headers,
                              body: formData,
                            });

                            if (response.ok) {
                              const data = await response.json();
                              console.log(
                                "[BookStyleReview] Transcribe response:",
                                {
                                  hasTranscription: !!data.transcription,
                                  hasLessonOptions: !!data.lessonOptions,
                                  practical: data.lessonOptions?.practical,
                                  emotional: data.lessonOptions?.emotional,
                                  character: data.lessonOptions?.character,
                                },
                              );

                              if (data.transcription) {
                                onTranscriptionChange(data.transcription);
                              }
                              // Use practical lesson as default (user can edit later)
                              if (data.lessonOptions?.practical) {
                                console.log(
                                  "[BookStyleReview] Setting lesson learned:",
                                  data.lessonOptions.practical,
                                );
                                onWisdomChange(data.lessonOptions.practical);
                              }
                            }
                          } catch (error) {
                            console.error("Transcription error:", error);
                          } finally {
                            setIsProcessing(false);
                          }
                        }}
                        onCancel={() => {
                          setIsRecording(false);
                          setIsPaused(false);
                          setRecordingTime(0);
                        }}
                      />
                    </div>
                    
                    {/* Modern recording UI */}
                    <div className="flex flex-col items-center gap-6">
                      <VoiceRecordingButton
                        isRecording={isRecording}
                        isPaused={isPaused}
                        recordingTime={recordingTime}
                        onStart={() => {
                          // Start recording via AudioRecorder ref
                          audioRecorderRef.current?.startRecording?.();
                        }}
                        audioRecorderRef={audioRecorderRef}
                      />
                      
                      {/* Recording controls */}
                      {isRecording && (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              if (isPaused) {
                                audioRecorderRef.current?.resumeRecording?.();
                                setIsPaused(false);
                              } else {
                                audioRecorderRef.current?.pauseRecording?.();
                                setIsPaused(true);
                              }
                            }}
                            variant="outline"
                            size="lg"
                            className="min-w-[120px]"
                          >
                            {isPaused ? "Resume" : "Pause"}
                          </Button>
                          <Button
                            onClick={() => {
                              audioRecorderRef.current?.stopRecording?.();
                            }}
                            variant="default"
                            size="lg"
                            className="min-w-[120px] bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                          >
                            Done
                          </Button>
                        </div>
                      )}
                      
                      {/* Cancel button when not recording yet */}
                      {!isRecording && (
                        <Button
                          onClick={() => setIsRecording(false)}
                          variant="ghost"
                          className="text-gray-600"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-coral-500 animate-spin" />
                      <div className="text-center">
                        <p className="text-xl font-medium text-gray-900">
                          Processing your recording...
                        </p>
                        <p className="text-lg text-gray-600 mt-1">
                          Transcribing audio and generating wisdom
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRecording(true)}
                        className="flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        REC Memory
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "audio/*";
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) {
                              setIsProcessing(true);

                              const audioUrl = URL.createObjectURL(file);
                              onAudioChange?.(audioUrl, file);

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
                                  console.log(
                                    "[BookStyleReview] Upload transcribe response:",
                                    {
                                      hasTranscription: !!data.transcription,
                                      hasLessonOptions: !!data.lessonOptions,
                                      practical: data.lessonOptions?.practical,
                                    },
                                  );

                                  if (data.transcription) {
                                    onTranscriptionChange(data.transcription);
                                  }
                                  // Use practical lesson as default (user can edit later)
                                  if (data.lessonOptions?.practical) {
                                    console.log(
                                      "[BookStyleReview] Setting lesson from upload:",
                                      data.lessonOptions.practical,
                                    );
                                    onWisdomChange(
                                      data.lessonOptions.practical,
                                    );
                                  }
                                }
                              } catch (error) {
                                console.error("Transcription error:", error);
                              } finally {
                                setIsProcessing(false);
                              }
                            }
                          };
                          input.click();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Audio
                      </Button>
                    </div>
                    <p className="text-base text-gray-500 mt-2">
                      Add an audio recording to preserve your voice with this
                      memory
                    </p>
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
                    {originalTranscription && (
                      <Button
                        onClick={handleUndoEnhancement}
                        disabled={isEnhancing}
                        size="sm"
                        variant="outline"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Undo2 className="w-4 h-4 mr-1.5" />
                        Undo Enhancement
                      </Button>
                    )}
                    <Button
                      onClick={handleEnhanceStory}
                      disabled={isEnhancing || !transcription?.trim()}
                      size="sm"
                      variant="outline"
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
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
                <Textarea
                  value={transcription}
                  onChange={(e) => onTranscriptionChange(e.target.value)}
                  className="w-full min-h-[300px] resize-none border-gray-300 rounded-lg p-4 text-gray-800 leading-relaxed font-serif text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400"
                  placeholder="Type or paste your story here. This is how it will appear in your book..."
                  disabled={isEnhancing}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Lesson Learned
                    </h3>
                    <Button
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
                      className="wisdom-quote p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-400 cursor-pointer hover:from-amber-100 hover:to-orange-100 transition-colors"
                      onClick={() => {
                        setTempWisdom(wisdomText);
                        setEditingWisdom(true);
                      }}
                    >
                      <p className="text-lg text-gray-700 italic">
                        {wisdomText ||
                          "Click to add a lesson or wisdom from this memory..."}
                      </p>
                      <Edit2 className="w-5 h-5 text-gray-400 mt-2" />
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
                          size="sm"
                          variant="outline"
                          onClick={handleWisdomSave}
                          className="text-green-600"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
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

      {/* Instructions */}
      <div className="max-w-3xl mx-auto px-4 pb-4 text-center text-lg text-gray-600">
        <p>Click on any element to edit it inline.</p>
      </div>

      {/* Bottom Action Buttons */}
      <div className="max-w-3xl mx-auto px-4 pb-8 space-y-3">
        <Button
          onClick={() => {
            console.log(
              "BookStyleReview: Bottom Save button clicked, calling onSave",
            );
            onSave();
          }}
          disabled={isSaving}
          className="w-full bg-heritage-coral hover:bg-heritage-coral/90 text-white rounded-full py-7 text-xl font-medium"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        {isEditing && onDelete && (
          <Button
            variant="outline"
            onClick={onDelete}
            disabled={isSaving}
            className="w-full rounded-full py-7 text-xl font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-6 h-6 mr-2" />
            Delete Memory
          </Button>
        )}
      </div>
    </div>
  );
}

export default BookStyleReview;
