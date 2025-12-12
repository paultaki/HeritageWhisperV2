"use client";

import { useState } from "react";
import { INTERVIEW_THEMES, type InterviewTheme } from "@/lib/interviewThemes";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type ThemeSelectorProps = {
  onSelectTheme: (theme: InterviewTheme) => void;
  userName?: string;
};

export function ThemeSelector({ onSelectTheme, userName }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<InterviewTheme | null>(null);

  const handleThemeClick = (theme: InterviewTheme) => {
    setSelectedTheme(theme);
  };

  const handleContinue = () => {
    if (selectedTheme) {
      onSelectTheme(selectedTheme);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--hw-page-bg)] overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="bg-[var(--hw-surface)] border-b border-[var(--hw-border-subtle)] px-4 py-6 text-center">
        <h1 className="text-2xl font-semibold text-[var(--hw-text-primary)] mb-2">
          Choose a Topic
        </h1>
        <p className="text-lg text-[var(--hw-text-secondary)]">
          What part of your life story would you like to share today?
        </p>
      </div>

      {/* Scrollable Theme List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-3">
          {INTERVIEW_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeClick(theme)}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all duration-200 min-h-[80px]
                hover:shadow-md
                ${selectedTheme?.id === theme.id
                  ? 'border-[var(--hw-primary)] bg-[var(--hw-primary-soft)] shadow-md'
                  : 'border-[var(--hw-border-subtle)] bg-[var(--hw-surface)] hover:border-[var(--hw-primary)]'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{theme.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold ${
                    selectedTheme?.id === theme.id ? 'text-[var(--hw-primary)]' : 'text-[var(--hw-text-primary)]'
                  }`}>
                    {theme.title}
                  </h3>
                  <p className="text-base text-[var(--hw-text-secondary)] mt-0.5">
                    {theme.description}
                  </p>
                </div>
                {selectedTheme?.id === theme.id && (
                  <div className="w-6 h-6 rounded-full bg-[var(--hw-primary)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Action Area */}
      <div className="bg-[var(--hw-surface)] border-t border-[var(--hw-border-subtle)] px-4 py-4 safe-area-pb">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-3">
          <Button
            onClick={handleContinue}
            disabled={!selectedTheme}
            className={`
              w-full min-h-[60px] text-lg font-medium rounded-xl transition-all
              ${selectedTheme
                ? 'bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white shadow-md'
                : 'bg-[var(--hw-border-subtle)] text-[var(--hw-text-muted)] cursor-not-allowed'
              }
            `}
          >
            {selectedTheme ? (
              <>
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            ) : (
              'Select a topic to continue'
            )}
          </Button>

          {/* Skip Option */}
          <button
            onClick={() => {
              const defaultTheme = INTERVIEW_THEMES.find(t => t.id === 'wisdom') || INTERVIEW_THEMES[0];
              onSelectTheme(defaultTheme);
            }}
            className="text-base text-[var(--hw-text-muted)] hover:text-[var(--hw-text-secondary)] underline py-2"
          >
            Skip and let Pearl choose
          </button>
        </div>
      </div>
    </div>
  );
}
