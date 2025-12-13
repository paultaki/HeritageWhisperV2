"use client";

import { useState, useRef } from "react";
import { ChevronDown, X, Check, Plus, ImageIcon, Loader2 } from "lucide-react";
import { AudioSegmentPlayer } from "./AudioSegmentPlayer";
import { DateOrAgeSelector } from "./DateOrAgeSelector";
import { formatDuration } from "@/lib/audioSlicer";
import Image from "next/image";

interface ParsedStory {
  id: string;
  recommendedTitle: string;
  bridgedText: string;
  rawTranscript: string;
  messageIds: string[];
  startTimestamp: string;
  endTimestamp: string;
  durationSeconds: number;
  audioUrl?: string;
  suggestedYear?: number;
  suggestedAge?: number;
  lifePhase?: string;
  wisdomSuggestion?: string;
  peopleMentioned?: string[];
  placesMentioned?: string[];
}

interface StoryEdits {
  title: string;
  storyYear?: number;
  storyAge?: number;
  lifePhase?: string;
  lessonLearned?: string;
  photos: any[];
  included: boolean;
}

interface StoryReviewCardProps {
  story: ParsedStory;
  index: number;
  totalStories: number;
  edits: StoryEdits;
  onUpdate: (updates: Partial<StoryEdits>) => void;
  onToggleIncluded: () => void;
  audioUrl: string;
  disabled?: boolean;
  userBirthYear?: number;
}

export function StoryReviewCard({
  story,
  index,
  totalStories,
  edits,
  onUpdate,
  onToggleIncluded,
  audioUrl,
  disabled = false,
  userBirthYear,
}: StoryReviewCardProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isIncluded = edits?.included ?? true;
  const isDisabled = disabled || !isIncluded;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isDisabled) return;

    setIsUploadingPhoto(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('photo', file);

      // Upload photo
      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      
      // Add photo to edits
      const newPhoto = {
        id: `photo-${Date.now()}`,
        filePath: data.path,
        masterPath: data.masterPath || data.path,
        displayPath: data.url,
        isHero: (edits?.photos?.length || 0) === 0, // First photo is hero
      };

      onUpdate({
        photos: [...(edits?.photos || []), newPhoto],
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    if (isDisabled) return;
    const updatedPhotos = (edits?.photos || []).filter(p => p.id !== photoId);
    // If we removed the hero, make the first remaining photo the hero
    if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isHero)) {
      updatedPhotos[0].isHero = true;
    }
    onUpdate({ photos: updatedPhotos });
  };

  return (
    <div
      className={`
        rounded-2xl border-2 p-4 sm:p-6 transition-all
        ${isIncluded && !disabled
          ? "border-[var(--hw-primary)] bg-white"
          : "border-[var(--hw-border-subtle)] bg-[var(--hw-section-bg)] opacity-60"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={onToggleIncluded}
            disabled={disabled}
            className={`
              w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${isIncluded && !disabled
                ? "bg-[var(--hw-primary)] border-[var(--hw-primary)] text-white"
                : "bg-white border-[var(--hw-border-subtle)]"
              }
            `}
            aria-label={isIncluded ? "Remove story" : "Include story"}
          >
            {isIncluded && !disabled && <Check className="w-4 h-4" />}
          </button>
          
          {/* Story number badge */}
          <span className="text-sm font-medium text-[var(--hw-text-muted)] uppercase">
            Story {index + 1} of {totalStories}
          </span>
        </div>

        {/* Remove button */}
        {isIncluded && !disabled && (
          <button
            onClick={onToggleIncluded}
            className="text-sm text-[var(--hw-text-secondary)] hover:text-[var(--hw-error)] transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {/* Title input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--hw-text-primary)] mb-1">
          Title
        </label>
        <input
          type="text"
          value={edits?.title || story.recommendedTitle}
          onChange={(e) => onUpdate({ title: e.target.value })}
          disabled={isDisabled}
          className={`
            w-full h-14 px-4 py-3 text-base
            bg-[var(--hw-surface)]
            border border-[var(--hw-border-subtle)] rounded-xl
            text-[var(--hw-text-primary)]
            placeholder:text-[var(--hw-text-muted)]
            focus:border-[var(--hw-primary)]
            focus:ring-2 focus:ring-[var(--hw-primary)] focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
          `}
          placeholder="Story title..."
        />
      </div>

      {/* Audio player */}
      <div className="mb-4">
        <AudioSegmentPlayer
          url={audioUrl}
          durationSeconds={story.durationSeconds}
          disabled={isDisabled}
        />
      </div>

      {/* Date/Age selector */}
      <div className="mb-4">
        <DateOrAgeSelector
          year={edits?.storyYear}
          age={edits?.storyAge}
          lifePhase={edits?.lifePhase}
          userBirthYear={userBirthYear}
          onChange={(values) => onUpdate(values)}
          disabled={isDisabled}
        />
        {!edits?.storyYear && !edits?.storyAge && (
          <p className="text-sm text-[var(--hw-text-muted)] mt-2 flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded-full bg-[var(--hw-primary-soft)] text-[var(--hw-primary)] text-xs flex items-center justify-center font-bold">i</span>
            Stories without dates go to Memory Box
          </p>
        )}
      </div>

      {/* Transcript toggle */}
      <button
        onClick={() => setShowTranscript(!showTranscript)}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 text-sm text-[var(--hw-text-secondary)]
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:text-[var(--hw-primary)]"}
          transition-colors mb-4
        `}
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showTranscript ? "rotate-180" : ""}`} />
        {showTranscript ? "Hide" : "Show"} transcript
      </button>

      {showTranscript && (
        <div className="p-4 bg-[var(--hw-section-bg)] rounded-xl text-base leading-relaxed mb-4 max-h-64 overflow-y-auto">
          {story.bridgedText || story.rawTranscript}
        </div>
      )}

      {/* Wisdom/Lesson input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--hw-text-primary)] mb-1">
          What&apos;s the lesson or wisdom from this story? <span className="font-normal text-[var(--hw-text-muted)]">(optional)</span>
        </label>
        <textarea
          value={edits?.lessonLearned || ""}
          onChange={(e) => onUpdate({ lessonLearned: e.target.value })}
          disabled={isDisabled}
          className={`
            w-full min-h-[80px] px-4 py-3 text-base
            bg-[var(--hw-surface)]
            border border-[var(--hw-border-subtle)] rounded-xl
            text-[var(--hw-text-primary)]
            placeholder:text-[var(--hw-text-muted)]
            focus:border-[var(--hw-primary)]
            focus:ring-2 focus:ring-[var(--hw-primary)] focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none transition-all
          `}
          placeholder={story.wisdomSuggestion || "What would you want your family to learn from this story?"}
        />
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-[var(--hw-text-primary)] mb-2">
          Add photos <span className="font-normal text-[var(--hw-text-muted)]">(optional)</span>
        </label>
        
        {/* Photo grid */}
        <div className="flex flex-wrap gap-2 mb-2">
          {(edits?.photos || []).map((photo) => (
            <div
              key={photo.id}
              className="relative w-20 h-20 rounded-lg overflow-hidden group"
            >
              <Image
                src={photo.displayPath || photo.filePath}
                alt="Story photo"
                fill
                className="object-cover"
              />
              {photo.isHero && (
                <span className="absolute top-1 left-1 bg-[var(--hw-accent-gold)] text-white text-xs px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              {!isDisabled && (
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}

          {/* Add photo button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={isDisabled || isUploadingPhoto}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || isUploadingPhoto}
            className={`
              w-20 h-20 rounded-lg border-2 border-dashed border-[var(--hw-border-subtle)]
              flex flex-col items-center justify-center gap-1
              ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[var(--hw-primary)] hover:bg-[var(--hw-primary-soft)]"}
              transition-colors
            `}
          >
            {isUploadingPhoto ? (
              <Loader2 className="w-5 h-5 text-[var(--hw-text-muted)] animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 text-[var(--hw-text-muted)]" />
                <span className="text-xs text-[var(--hw-text-muted)]">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
