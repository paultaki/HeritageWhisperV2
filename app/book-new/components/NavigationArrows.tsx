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
      {/* Left arrow */}
      {canGoPrevious && (
        <button
          onClick={onPrevious}
          aria-label="Previous"
          style={{
            position: 'absolute',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <ChevronLeft
            size={24}
            style={{
              position: 'fixed',
              left: '-2px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              color: '#d6d3d1', // stone-300
            }}
          />
        </button>
      )}

      {/* Right arrow */}
      {canGoNext && (
        <button
          onClick={onNext}
          aria-label="Next"
          style={{
            position: 'absolute',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <ChevronRight
            size={24}
            style={{
              position: 'fixed',
              right: '-2px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              color: '#d6d3d1', // stone-300
            }}
          />
        </button>
      )}
    </>
  );
}
