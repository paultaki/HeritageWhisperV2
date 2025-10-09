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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiPhotoUploader, type StoryPhoto } from "@/components/MultiPhotoUploader";
import { AudioRecorder } from "@/components/AudioRecorder";
import { supabase } from "@/lib/supabase";

interface BookStyleReviewProps {
  title: string;
  storyYear: string;
  transcription: string;
  photos: StoryPhoto[];
  wisdomText: string;
  audioUrl?: string | null;
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
  const [isProcessing, setIsProcessing] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const wisdomInputRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2c2416] via-[#1a1410] to-[#2c2416] md:bg-gradient-to-b md:from-amber-50 md:to-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-[#8B6F47]/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <h1 className="text-xl md:text-2xl font-serif text-gray-800 flex-shrink-0">Review Memory</h1>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-full px-4 ml-auto mr-12 md:mr-20 2xl:mr-0"
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
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
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
                  className="memory-title text-4xl font-serif text-gray-900 cursor-pointer hover:bg-amber-50 rounded px-3 -mx-3 py-2 transition-colors flex items-center gap-2"
                  onClick={() => {
                    setTempTitle(title);
                    setEditingTitle(true);
                  }}
                >
                  {title || "Click to add title"}
                  <Edit2 className="w-5 h-5 text-gray-400" />
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
                  className="text-4xl font-serif"
                  placeholder="Give your memory a title..."
                />
              )}
            </div>

            {/* 3. Date - Inline Editable */}
            <div className="group relative">
              {!editingYear ? (
                <p
                  className="text-lg text-gray-600 cursor-pointer hover:bg-amber-50 rounded px-3 -mx-3 py-1 transition-colors inline-flex items-center gap-2"
                  onClick={() => {
                    setTempYear(storyYear);
                    setEditingYear(true);
                  }}
                >
                  <Calendar className="w-5 h-5" />
                  {storyYear || "Add year"}
                  {age !== null && age > 0 && ` • Age ${age}`}
                  {age !== null && age === 0 && ` • Birth`}
                  {age !== null && age < 0 && ` • Before birth`}
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
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
                    className="w-32 text-lg"
                    placeholder="Year"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              )}
            </div>

            {/* 4. Audio Recording */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Audio Recording (Optional)
              </h3>
              {audioUrl ? (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <audio controls src={audioUrl} className="w-full mb-3" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to re-record? This will replace your current audio.")) {
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
                        if (confirm("Are you sure you want to remove this audio?")) {
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
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <AudioRecorder
                    onRecordingComplete={async (audioBlob) => {
                      setIsRecording(false);
                      setIsProcessing(true);

                      const audioUrl = URL.createObjectURL(audioBlob);
                      onAudioChange?.(audioUrl, audioBlob);

                      // Transcribe the audio
                      const formData = new FormData();
                      formData.append('audio', audioBlob);

                      try {
                        const { supabase } = await import("@/lib/supabase");
                        const { data: { session } } = await supabase.auth.getSession();

                        const headers: HeadersInit = {};
                        if (session?.access_token) {
                          headers['Authorization'] = `Bearer ${session.access_token}`;
                        }

                        const response = await fetch('/api/transcribe', {
                          method: 'POST',
                          headers,
                          body: formData,
                        });

                        if (response.ok) {
                          const data = await response.json();
                          if (data.transcription) {
                            onTranscriptionChange(data.transcription);
                          }
                          if (data.wisdomSuggestion) {
                            onWisdomChange(data.wisdomSuggestion);
                          }
                        }
                      } catch (error) {
                        console.error('Transcription error:', error);
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    onCancel={() => setIsRecording(false)}
                  />
                </div>
              ) : isProcessing ? (
                <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-coral-500 animate-spin" />
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Processing your recording...</p>
                      <p className="text-sm text-gray-600 mt-1">
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
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'audio/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            setIsProcessing(true);

                            const audioUrl = URL.createObjectURL(file);
                            onAudioChange?.(audioUrl, file);

                            // Transcribe the audio
                            const formData = new FormData();
                            formData.append('audio', file);

                            try {
                              const { supabase } = await import("@/lib/supabase");
                              const { data: { session } } = await supabase.auth.getSession();

                              const headers: HeadersInit = {};
                              if (session?.access_token) {
                                headers['Authorization'] = `Bearer ${session.access_token}`;
                              }

                              const response = await fetch('/api/transcribe', {
                                method: 'POST',
                                headers,
                                body: formData,
                              });

                              if (response.ok) {
                                const data = await response.json();
                                if (data.transcription) {
                                  onTranscriptionChange(data.transcription);
                                }
                                if (data.wisdomSuggestion) {
                                  onWisdomChange(data.wisdomSuggestion);
                                }
                              }
                            } catch (error) {
                              console.error('Transcription error:', error);
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
                  <p className="text-xs text-gray-500 mt-2">
                    Add an audio recording to preserve your voice with this memory
                  </p>
                </div>
              )}
            </div>

            {/* 5. Your Story */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Your Story</h3>
              <Textarea
                value={transcription}
                onChange={(e) => onTranscriptionChange(e.target.value)}
                className="w-full min-h-[300px] resize-none border-gray-300 rounded-lg p-4 text-gray-800 leading-relaxed font-serif text-base focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400"
                placeholder="Type or paste your story here. This is how it will appear in your book..."
              />
              {transcription && (
                <p className="text-xs text-gray-500 mt-2">
                  {transcription.split(' ').filter(w => w.length > 0).length} words
                </p>
              )}
            </div>

            {/* 6. Lesson Learned */}
            <div>
              <div className="group relative">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Lesson Learned
                </h3>
                {!editingWisdom ? (
                  <div
                    className="wisdom-quote p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-400 cursor-pointer hover:from-amber-100 hover:to-orange-100 transition-colors"
                    onClick={() => {
                      setTempWisdom(wisdomText);
                      setEditingWisdom(true);
                    }}
                  >
                    <p className="text-gray-700 italic">
                      {wisdomText || "Click to add a lesson or wisdom from this memory..."}
                    </p>
                    <Edit2 className="w-4 h-4 text-gray-400 mt-2" />
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
      <div className="max-w-3xl mx-auto px-4 pb-4 text-center text-sm text-gray-600">
        <p>Click on any element to edit it inline.</p>
      </div>

      {/* Bottom Action Buttons */}
      <div className="max-w-3xl mx-auto px-4 pb-8 space-y-3">
        <Button
          onClick={() => {
            console.log("BookStyleReview: Bottom Save button clicked, calling onSave");
            onSave();
          }}
          disabled={isSaving}
          className="w-full bg-heritage-coral hover:bg-heritage-coral/90 text-white rounded-full py-6 text-lg font-medium"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        {isEditing && onDelete && (
          <Button
            variant="outline"
            onClick={onDelete}
            disabled={isSaving}
            className="w-full rounded-full py-6 text-lg font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Memory
          </Button>
        )}
      </div>
    </div>
  );
}

export default BookStyleReview;
