"use client";

import { useState } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { AudioSegmentPlayer } from "./AudioSegmentPlayer";
import { DateOrAgeSelector } from "./DateOrAgeSelector";
import { formatDuration } from "@/lib/audioSlicer";

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

  const isIncluded = edits?.included ?? true;
  const isDisabled = disabled || !isIncluded;

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
      <div>
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
    </div>
  );
}
