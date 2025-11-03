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
    <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between">
      {/* Previous button */}
      <button
        onClick={onPrevious}
        className={`pointer-events-auto ml-3 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-md ring-1 ring-white/10 transition active:scale-95 ${
          canGoPrevious ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Previous"
        disabled={!canGoPrevious}
        style={{ visibility: canGoPrevious ? "visible" : "hidden" }}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        className={`pointer-events-auto mr-3 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-md ring-1 ring-white/10 transition active:scale-95 ${
          canGoNext ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Next"
        disabled={!canGoNext}
        style={{ visibility: canGoNext ? "visible" : "hidden" }}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
