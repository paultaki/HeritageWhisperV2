"use client";

import { useEffect } from "react";

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
    <div className="whisper-page">
      {/* The whisper content - centered and gentle */}
      <div className="whisper-content">
        
        {/* Context - very subtle, like a margin note */}
        <p className="whisper-context text-center">
          After reading your {afterStory.year} story...
        </p>
        
        {/* The question - the heart of the whisper */}
        <h2 className="whisper-question text-center">
          {prompt.promptText}
        </h2>
        
        {/* Optional context note - even more subtle */}
        {prompt.contextNote && (
          <p className="whisper-context text-center" style={{ marginTop: '-1rem', marginBottom: '2rem' }}>
            {prompt.contextNote}
          </p>
        )}
        
        {/* Actions - gentle invitation, not pressure */}
        <div className="whisper-actions flex gap-4 justify-center flex-col sm:flex-row">
          <button
            onClick={onRecord}
            className="whisper-action-primary transform hover:scale-105 transition-transform"
            aria-label="Start recording this story"
          >
            I want to tell this story
          </button>
          
          <button
            onClick={onContinue}
            className="whisper-action-secondary hover:border-gray-400 transition-colors"
            aria-label="Continue reading"
          >
            Continue reading
          </button>
        </div>
      </div>
    </div>
  );
}
