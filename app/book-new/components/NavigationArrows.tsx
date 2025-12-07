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
          aria-label="Previous page"
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
            size={32}
            strokeWidth={2.5}
            style={{
              position: 'fixed',
              left: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              color: '#78716c', // stone-500 - more visible
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
          />
        </button>
      )}

      {/* Right arrow */}
      {canGoNext && (
        <button
          onClick={onNext}
          aria-label="Next page"
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
            size={32}
            strokeWidth={2.5}
            style={{
              position: 'fixed',
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              color: '#78716c', // stone-500 - more visible
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
          />
        </button>
      )}
    </>
  );
}
