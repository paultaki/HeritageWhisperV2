"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const PROCESSING_MESSAGES = [
  "Loading your stories...",
  "Analyzing your conversation...",
  "Identifying key moments...",
  "Preparing your audio...",
  "Almost ready...",
];

interface ProcessingOverlayProps {
  isVisible: boolean;
}

export function ProcessingOverlay({ isVisible }: ProcessingOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      return;
    }

    // Cycle through messages every 3 seconds
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl text-center">
        <div className="w-16 h-16 border-4 border-[var(--hw-primary)]/20 border-t-[var(--hw-primary)] rounded-full mx-auto mb-6 animate-spin" />

        {/* Current message with smooth transition */}
        <p className="text-[var(--hw-text-primary)] text-xl font-medium mb-2 transition-opacity duration-300">
          {PROCESSING_MESSAGES[currentMessageIndex]}
        </p>

        <p className="text-[var(--hw-text-muted)] text-base">
          This can take a few minutes for longer conversations
        </p>

        {/* Progress dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {PROCESSING_MESSAGES.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentMessageIndex
                  ? 'bg-[var(--hw-primary)] w-6'
                  : 'bg-[var(--hw-border-subtle)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
