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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiPhotoUploader, type StoryPhoto } from "@/components/MultiPhotoUploader";
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
  isSaving?: boolean;
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
  isSaving = false,
  userBirthYear = 1950,
}: BookStyleReviewProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingYear, setEditingYear] = useState(false);
  const [editingWisdom, setEditingWisdom] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempYear, setTempYear] = useState(storyYear);
  const [tempWisdom, setTempWisdom] = useState(wisdomText);

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header with Save/Cancel buttons */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-serif text-gray-800">Review Your Memory</h1>
            {/* Classic View Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate back to classic review with all data preserved
                const params = new URLSearchParams();
                if (title) params.set('title', encodeURIComponent(title));
                if (storyYear) params.set('year', storyYear);
                if (transcription) params.set('transcription', encodeURIComponent(transcription));
                if (audioUrl) params.set('audioUrl', encodeURIComponent(audioUrl));

                // Store current data in session storage
                sessionStorage.setItem('reviewData', JSON.stringify({
                  title,
                  storyYear,
                  transcription,
                  photos,
                  wisdomText,
                  audioUrl
                }));

                window.location.href = `/review/create?${params.toString()}`;
              }}
              className="hidden sm:flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Classic View
            </Button>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("BookStyleReview: Save button clicked, calling onSave");
                onSave();
              }}
              disabled={isSaving}
              className="bg-heritage-coral hover:bg-heritage-coral/90 text-white rounded-full px-6"
            >
              {isSaving ? "Saving..." : "Save Story"}
            </Button>
          </div>
        </div>
      </div>

      {/* Book Container */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-[#faf8f5] rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: '2/1.4' }}>
          {/* Two-page layout - always show both pages side by side */}
          <div className="flex min-h-[700px]">

            {/* Left Page - Photo and Basic Info */}
            <div className="w-1/2 p-6 md:p-8 lg:p-12 border-r border-gray-200 flex flex-col bg-[#faf8f5]">
              {/* Running header */}
              <div className="running-header text-xs text-gray-500 uppercase tracking-wider mb-6">
                Your Heritage Story
              </div>

              {/* Photo Section - FIRST */}
              <div className="mb-6">
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

              {/* Title - Inline Editable - SECOND */}
              <div className="mb-4 group relative">
                {!editingTitle ? (
                  <h2
                    className="memory-title text-3xl font-serif text-gray-900 cursor-pointer hover:bg-amber-50 rounded px-2 -mx-2 py-1 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setTempTitle(title);
                      setEditingTitle(true);
                    }}
                  >
                    {title || "Click to add title"}
                    <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={titleInputRef}
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTitleSave();
                        if (e.key === "Escape") {
                          setTempTitle(title);
                          setEditingTitle(false);
                        }
                      }}
                      className="text-3xl font-serif"
                      placeholder="Give your memory a title..."
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTitleSave}
                      className="text-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTempTitle(title);
                        setEditingTitle(false);
                      }}
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Year - Inline Editable */}
              <div className="mb-4 group relative">
                {!editingYear ? (
                  <p
                    className="text-sm text-gray-600 cursor-pointer hover:bg-amber-50 rounded px-2 -mx-2 py-1 transition-colors inline-flex items-center gap-2"
                    onClick={() => {
                      setTempYear(storyYear);
                      setEditingYear(true);
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                    {storyYear || "Add year"}
                    {age !== null && ` • Age ${age}`}
                    <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <Input
                      ref={yearInputRef}
                      type="number"
                      value={tempYear}
                      onChange={(e) => setTempYear(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleYearSave();
                        if (e.key === "Escape") {
                          setTempYear(storyYear);
                          setEditingYear(false);
                        }
                      }}
                      className="w-24"
                      placeholder="Year"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleYearSave}
                      className="text-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTempYear(storyYear);
                        setEditingYear(false);
                      }}
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Audio Section - Below year, before text */}
              <div className="mb-6">
                {audioUrl ? (
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Audio Recording
                    </p>
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Audio Recording (Optional)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to recording page to record audio
                          sessionStorage.setItem('reviewData', JSON.stringify({
                            title,
                            storyYear,
                            transcription,
                            photos,
                            wisdomText,
                            audioUrl
                          }));
                          window.location.href = '/recording';
                        }}
                        className="flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        Record Audio
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Trigger file upload for audio
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'audio/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              if (onAudioChange) {
                                onAudioChange(url, file);
                              }

                              // Trigger transcription
                              const formData = new FormData();
                              formData.append('audio', file);

                              try {
                                // Get auth token from Supabase session
                                const { data: { session } } = await supabase.auth.getSession();
                                const headers: HeadersInit = {};

                                if (session?.access_token) {
                                  headers['Authorization'] = `Bearer ${session.access_token}`;
                                }

                                const response = await fetch('/api/transcribe', {
                                  method: 'POST',
                                  body: formData,
                                  headers
                                });

                                if (response.ok) {
                                  const { transcription: newTranscription, wisdomSuggestion } = await response.json();
                                  if (newTranscription && onTranscriptionChange) {
                                    // If there's no existing transcription, set the new one
                                    if (!transcription) {
                                      onTranscriptionChange(newTranscription);
                                    }
                                  }
                                  if (wisdomSuggestion && !wisdomText && onWisdomChange) {
                                    onWisdomChange(wisdomSuggestion);
                                  }
                                } else {
                                  console.error('Transcription failed:', response.status, await response.text());
                                }
                              } catch (error) {
                                console.error('Transcription failed:', error);
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

              {/* Spacer to push lesson learned to bottom */}
              <div className="flex-grow"></div>

              {/* Lesson Learned - Inline Editable */}
              <div className="mt-6">
                <div className="group relative">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
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
                      <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
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

            {/* Right Page - Story Content */}
            <div className="w-1/2 p-6 md:p-8 lg:p-12 bg-[#faf8f5]">
              {/* Running header */}
              <div className="running-header text-xs text-gray-500 uppercase tracking-wider mb-6 text-right">
                {storyYear || new Date().getFullYear()}
              </div>

              {/* Story Content - Editable */}
              <div className="story-content">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Your Story</h3>
                <Textarea
                  value={transcription}
                  onChange={(e) => onTranscriptionChange(e.target.value)}
                  className="w-full min-h-[600px] resize-none border-0 bg-transparent p-0 text-gray-800 leading-relaxed font-serif text-base focus:outline-none focus:ring-0 placeholder:text-gray-400"
                  placeholder="Type or paste your story here. This is how it will appear in your book..."
                />
                {transcription && (
                  <p className="text-xs text-gray-500 mt-4 text-right">
                    {transcription.split(' ').length} words
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Click on any element to edit it inline. This preview shows exactly how your story will appear in the book.</p>
        </div>
      </div>
    </div>
  );
}

export default BookStyleReview;