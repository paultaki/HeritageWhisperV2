"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BottomNavProps {
  currentStory: number;
  totalStories: number;
  onPrevious: () => void;
  onNext: () => void;
  onTocClick: () => void;
}

export function BottomNav({
  currentStory,
  totalStories,
  onPrevious,
  onNext,
  onTocClick,
}: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 no-print">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="flex items-center justify-between gap-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 shadow-2xl">
          <button
            onClick={onPrevious}
            disabled={currentStory === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-white font-medium">
              Story {currentStory + 1} of {totalStories}
            </span>
            <button
              onClick={onTocClick}
              className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white"
              title="Table of Contents"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 6h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 18h16"></path>
              </svg>
            </button>
          </div>

          <button
            onClick={onNext}
            disabled={currentStory === totalStories - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white font-medium"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
