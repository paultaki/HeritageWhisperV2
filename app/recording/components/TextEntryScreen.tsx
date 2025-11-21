"use client";

import { useState } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import { type TextEntryScreenProps } from "../types";
import "../recording.css";

/**
 * TextEntryScreen - Text-only alternative to audio recording
 * Large textarea with word count and optional "Back to Audio" escape hatch
 * Based on heritage-whisper-recorder reference implementation
 */
export function TextEntryScreen({
  draft,
  onChange,
  onBack,
  onSaveStory,
  onBackToAudio,
}: TextEntryScreenProps) {
  const [textError, setTextError] = useState<string>("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textBody = e.target.value;
    onChange({ ...draft, textBody });
    if (textError && textBody.trim()) {
      setTextError("");
    }
  };

  const handleSave = () => {
    if (!draft.textBody?.trim()) {
      setTextError("Please write your story before saving");
      return;
    }

    const completeDraft = {
      ...draft,
      title: draft.title || "Untitled Story",
      textBody: draft.textBody,
      recordingMode: "text" as const,
    };

    onSaveStory(completeDraft as any);
  };

  const wordCount = draft.textBody
    ? draft.textBody.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="hw-screen-wrapper">
      {/* Header */}
      <div className="hw-screen-header">
        <button
          onClick={onBack}
          className="hw-btn-icon hw-btn-ghost"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {draft.photoUrl && (
            <img
              src={draft.photoUrl}
              alt="Story photo"
              className="w-8 h-8 rounded object-cover"
            />
          )}
          <h1 className="hw-heading-md">{draft.title || "Write Your Story"}</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="hw-screen-content">
        <div className="hw-stack-lg">
          {/* Instructions */}
          <div className="hw-text-center">
            <p className="hw-body-base hw-text-muted">
              Write your story in your own words. Take your time – there's no rush.
            </p>
          </div>

          {/* Text Input */}
          <div className="relative">
            <textarea
              value={draft.textBody || ""}
              onChange={handleTextChange}
              placeholder="Start typing your story here..."
              className="hw-textarea"
              style={{ minHeight: "300px" }}
              autoFocus
            />
            {/* Word Count Overlay */}
            <div className="absolute bottom-3 right-3 bg-white px-2 py-1 rounded hw-body-sm hw-text-muted">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </div>
          </div>

          {textError && (
            <p className="hw-text-error hw-body-sm">{textError}</p>
          )}

          {/* Helpful Prompts */}
          <div className="hw-card">
            <p className="hw-body-sm hw-text-muted mb-2">
              <strong>Need inspiration?</strong> Try answering these questions:
            </p>
            <ul className="hw-body-sm hw-text-muted space-y-1 list-disc list-inside">
              <li>What happened?</li>
              <li>Who was there with you?</li>
              <li>How did you feel?</li>
              <li>What did you learn from this experience?</li>
            </ul>
          </div>

          {/* Optional: Back to Audio */}
          {onBackToAudio && (
            <button
              onClick={onBackToAudio}
              className="hw-btn hw-btn-ghost w-full"
            >
              <Mic className="w-5 h-5" />
              Record Audio Instead
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="hw-screen-footer">
        <button
          onClick={handleSave}
          className="hw-btn hw-btn-primary hw-btn-lg w-full"
          disabled={!draft.textBody?.trim()}
        >
          Save Story
        </button>
      </div>
    </div>
  );
}
