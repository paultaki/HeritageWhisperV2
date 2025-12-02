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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-amber-50 to-white p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif text-amber-900 mb-3">
            Welcome, {userName?.split(' ')[0] || 'friend'}!
          </h1>
          <p className="text-gray-600 text-lg">
            What chapter of your life would you like to explore today?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Choose a theme to guide our conversation
          </p>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {INTERVIEW_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeClick(theme)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all duration-200
                hover:shadow-md hover:border-amber-400
                ${selectedTheme?.id === theme.id
                  ? 'border-amber-500 bg-amber-50 shadow-md'
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{theme.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${
                    selectedTheme?.id === theme.id ? 'text-amber-900' : 'text-gray-900'
                  }`}>
                    {theme.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {theme.description}
                  </p>
                </div>
                {selectedTheme?.id === theme.id && (
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleContinue}
            disabled={!selectedTheme}
            className={`
              px-8 py-6 text-lg font-semibold rounded-full transition-all
              ${selectedTheme
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {selectedTheme ? (
              <>
                Let's Begin
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              'Select a theme to continue'
            )}
          </Button>

          {/* Skip Option */}
          <button
            onClick={() => {
              // Use childhood as default if user wants to skip
              const defaultTheme = INTERVIEW_THEMES.find(t => t.id === 'wisdom') || INTERVIEW_THEMES[0];
              onSelectTheme(defaultTheme);
            }}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Skip and let Pearl choose
          </button>
        </div>

        {/* Selected Theme Preview */}
        {selectedTheme && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
            <p className="text-sm text-amber-800 font-medium mb-2">
              We'll start by warming up with a few easy questions:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {selectedTheme.warmUpQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
