"use client";

import { useEffect } from "react";
import { Sparkles } from "lucide-react";

interface WhisperPageProps {
  prompt: {
    id: string;
    promptText: string;
    contextNote?: string;
  };
  afterStory: {
    year: string;
    title: string;
  };
  onRecord: () => void;
  onContinue: () => void;
}

export default function WhisperPage({ 
  prompt, 
  afterStory, 
  onRecord, 
  onContinue 
}: WhisperPageProps) {
  // Track that they encountered this whisper (not skipped - just seen)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`whisper_seen_${prompt.id}`, Date.now().toString());
    }
  }, [prompt.id]);

  return (
    <div className="whisper-page h-full flex items-center justify-center p-8 md:p-12">
      {/* The whisper content - centered and gentle */}
      <div className="whisper-content max-w-2xl mx-auto text-center">
        
        {/* Context - very subtle, like a margin note */}
        <p className="text-xs md:text-sm text-gray-400 italic mb-6 md:mb-8 opacity-70">
          After reading your {afterStory.year} story...
        </p>
        
        {/* The question - the heart of the whisper */}
        <div className="mb-10 md:mb-14">
          <p className="whisper-question text-xl md:text-2xl lg:text-3xl 
                        font-serif text-gray-700 leading-relaxed px-4">
            {prompt.promptText}
          </p>
        </div>
        
        {/* Optional context note - even more subtle */}
        {prompt.contextNote && (
          <p className="text-xs md:text-sm text-gray-400 italic mb-8 opacity-60">
            {prompt.contextNote}
          </p>
        )}
        
        {/* Actions - gentle invitation, not pressure */}
        <div className="whisper-actions flex flex-col sm:flex-row items-center justify-center gap-4 text-sm md:text-base">
          <button
            onClick={onRecord}
            className="text-amber-600 hover:text-amber-700 underline underline-offset-4
                     transition-colors duration-200 px-4 py-2"
            aria-label="Start recording this story"
          >
            I want to tell this story
          </button>
          
          <span className="hidden sm:inline text-gray-300">·</span>
          
          <button
            onClick={onContinue}
            className="text-gray-500 hover:text-gray-700 underline underline-offset-4
                     transition-colors duration-200 px-4 py-2"
            aria-label="Continue reading"
          >
            Continue reading
          </button>
        </div>
        
        {/* Very subtle sparkle - shows this is special */}
        <div className="mt-12 md:mt-16 opacity-30">
          <Sparkles className="w-4 h-4 mx-auto text-amber-400" />
        </div>
      </div>
    </div>
  );
}
