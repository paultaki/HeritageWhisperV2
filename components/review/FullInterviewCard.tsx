"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { AudioSegmentPlayer } from "./AudioSegmentPlayer";
import { formatDuration } from "@/lib/audioSlicer";

interface FullInterviewCardProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  onTitleChange: (title: string) => void;
  transcript: string;
  audioUrl: string;
  durationSeconds: number;
}

export function FullInterviewCard({
  checked,
  onToggle,
  title,
  onTitleChange,
  transcript,
  audioUrl,
  durationSeconds,
}: FullInterviewCardProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div
      className={`
        rounded-2xl border-2 p-4 sm:p-6 transition-all
        ${checked
          ? "border-[var(--hw-primary)] bg-white"
          : "border-[var(--hw-border-subtle)] bg-[var(--hw-section-bg)]"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`
            w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors
            ${checked
              ? "bg-[var(--hw-primary)] border-[var(--hw-primary)] text-white"
              : "bg-white border-[var(--hw-border-subtle)]"
            }
          `}
          aria-label={checked ? "Deselect full interview" : "Save as one story"}
        >
          {checked && <Check className="w-4 h-4" />}
        </button>
        
        <div className="flex-1">
          <span className="text-sm font-medium text-[var(--hw-text-muted)] uppercase">
            Save as One Story
          </span>
          <p className="text-base text-[var(--hw-text-secondary)] mt-1">
            Keep the full interview with Pearl&apos;s questions included
          </p>
        </div>
      </div>

      {/* Title input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--hw-text-primary)] mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={!checked}
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
          placeholder="Interview title..."
        />
      </div>

      {/* Audio player */}
      <div className="mb-4">
        <AudioSegmentPlayer
          url={audioUrl}
          durationSeconds={durationSeconds}
          disabled={!checked}
        />
      </div>

      {/* Transcript toggle */}
      <button
        onClick={() => setShowTranscript(!showTranscript)}
        disabled={!checked}
        className={`
          flex items-center gap-2 text-sm text-[var(--hw-text-secondary)]
          ${!checked ? "opacity-50 cursor-not-allowed" : "hover:text-[var(--hw-primary)]"}
          transition-colors
        `}
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showTranscript ? "rotate-180" : ""}`} />
        {showTranscript ? "Hide" : "Show"} full transcript
      </button>

      {showTranscript && checked && (
        <div className="mt-4 p-4 bg-[var(--hw-section-bg)] rounded-xl text-base leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
          {transcript}
        </div>
      )}

      {/* Info note */}
      <div className="mt-4 p-3 bg-[var(--hw-primary-soft)] rounded-xl">
        <p className="text-sm text-[var(--hw-text-secondary)]">
          <span className="font-medium text-[var(--hw-primary)]">Note:</span> This includes the full conversation, including Pearl&apos;s questions. Individual stories above have been edited to flow as standalone narratives.
        </p>
      </div>
    </div>
  );
}
