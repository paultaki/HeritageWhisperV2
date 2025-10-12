"use client";

import { useState } from "react";
import { Sparkles, X, Mic } from "lucide-react";
import { dismissPrompt } from "@/lib/promptRotation";

interface TimelinePromptCardProps {
  prompt: {
    id: string;
    prompt_text: string;
    context_note?: string | null;
  };
  onRecord: (promptId: string, promptText: string) => void;
  onDismiss?: () => void;
}

export function TimelinePromptCard({ 
  prompt, 
  onRecord,
  onDismiss 
}: TimelinePromptCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    // Dismiss for 24 hours
    dismissPrompt(prompt.id);
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="timeline-prompt-card relative max-w-[600px] mx-auto mb-8 mt-4">
      {/* Minimize button */}
      <button
        onClick={handleDismiss}
        className="timeline-prompt-minimize absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
        aria-label="Dismiss for 24 hours"
        title="Not today (hide for 24 hours)"
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>

      <div className="relative p-6 bg-gradient-to-br from-[#FFFBF5] to-[#FFF9F0] rounded-xl border border-amber-200/30 shadow-sm">
        {/* Subtle sparkle indicator */}
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-500" />
        </div>

        {/* Prompt text - 18px, not 24px */}
        <p className="timeline-prompt-text text-lg leading-relaxed text-gray-800 font-serif mb-4 pr-6">
          {prompt.prompt_text}
        </p>

        {/* Context note if available */}
        {prompt.context_note && (
          <p className="text-xs text-gray-500 italic mb-4">
            {prompt.context_note}
          </p>
        )}

        {/* Compact action button */}
        <button
          onClick={() => onRecord(prompt.id, prompt.prompt_text)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Mic className="w-4 h-4" />
          Record This Memory
        </button>
      </div>
    </div>
  );
}
