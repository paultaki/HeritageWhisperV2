"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavigationArrowsProps } from "./types";

export default function NavigationArrows({
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: NavigationArrowsProps) {
  return (
    <>
      {/* Previous button */}
      <button
        onClick={onPrevious}
        className={`pointer-events-auto fixed top-1/2 -translate-y-1/2 z-20 text-stone-400 transition active:scale-95 ${
          canGoPrevious ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Previous"
        disabled={!canGoPrevious}
        style={{
          visibility: canGoPrevious ? "visible" : "hidden",
          left: '3px'
        }}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        className={`pointer-events-auto fixed top-1/2 -translate-y-1/2 z-20 text-stone-400 transition active:scale-95 ${
          canGoNext ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Next"
        disabled={!canGoNext}
        style={{
          visibility: canGoNext ? "visible" : "hidden",
          right: '3px'
        }}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </>
  );
}
