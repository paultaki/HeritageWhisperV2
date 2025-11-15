"use client";

import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";

interface HomeScreenProps {
  onStartRecording: (prompt?: string) => void;
}

const DAILY_PROMPTS = [
  "Tell me about your favorite childhood meal.",
  "Who was a teacher that made a difference?",
  "What did a perfect summer day look like?",
];

export function HomeScreen({ onStartRecording }: HomeScreenProps) {
  return (
    <div className="relative hw-page">
      {/* Premium background glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(600px 220px at 50% -80px, rgba(44, 82, 130, 0.25), transparent), radial-gradient(500px 320px at 90% 10%, rgba(237, 137, 54, 0.2), transparent), radial-gradient(500px 320px at 10% 20%, rgba(44, 82, 130, 0.18), transparent)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              Record a Memory
            </h1>
            <p className="text-[13px] text-gray-500">Quick voice recording</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-8 max-w-md mx-auto">
        <div className="py-16 text-center">
          {/* Primary CTA */}
          <button
            onClick={() => onStartRecording()}
            className="
              w-full px-8 py-6
              bg-[#2C5282] text-white text-xl font-semibold tracking-tight
              rounded-2xl
              shadow-sm hover:shadow-md hover:brightness-110
              active:brightness-90 active:scale-[0.99]
              transition-all duration-150
              min-h-[88px]
              outline-none focus-visible:ring-4 focus-visible:ring-[#2C5282]/30
            "
            aria-label="Start recording a memory"
          >
            <div className="flex items-center justify-center gap-3">
              <Mic className="w-6 h-6" />
              Start Recording
            </div>
          </button>

          <p className="mt-4 text-base text-gray-500 leading-relaxed">
            Tap to begin • 2–5 minutes
          </p>

          {/* Daily prompts section */}
          <div className="mt-12 bg-gray-50 rounded-2xl p-5 text-left border border-gray-200">
            <h3 className="text-base font-semibold tracking-tight text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ED8936]" />
              Today's gentle prompts
            </h3>
            <ul className="mt-3 space-y-2 text-[15px] text-gray-700">
              {DAILY_PROMPTS.map((prompt, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-base mt-[2px]" aria-hidden="true">
                    {index === 0 ? "🌻" : index === 1 ? "💭" : "🌅"}
                  </span>
                  <button
                    onClick={() => onStartRecording(prompt)}
                    className="text-left hover:text-[#2C5282] transition-colors"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              Pick a prompt or start recording without one.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
