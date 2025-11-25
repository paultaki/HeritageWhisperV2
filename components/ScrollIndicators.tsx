"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollIndicatorProps {
  /** Whether to show the indicators */
  show: boolean;
  /** Scroll progress percentage (0-100) */
  scrollProgress?: number;
  /** Content type for styling */
  contentType?: 'story' | 'timeline' | 'book';
  /** Position of indicator */
  position?: 'left' | 'right';
  /** Callback when clicked to scroll */
  onScrollClick?: () => void;
}

/**
 * Multi-layered scroll indicator for seniors
 * Combines torn edge, gradient fade, and subtle text hint
 */
export function ScrollIndicator({ 
  show, 
  contentType = 'book',
  position = 'left',
  onScrollClick
}: ScrollIndicatorProps) {
  if (!show) {
    return null;
  }

  return (
    <>
      {/* Layer 1: Gradient Fade Overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 transition-opacity duration-500"
        style={{
          height: '120px',
          background: 'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(250, 248, 245, 0.3) 50%, rgba(250, 248, 245, 0.7) 75%, rgba(250, 248, 245, 0.95) 100%)',
          zIndex: 50,
          opacity: show ? 1 : 0,
          pointerEvents: onScrollClick ? 'auto' : 'none',
          cursor: onScrollClick ? 'pointer' : 'default'
        }}
        onClick={onScrollClick}
      >
        {/* Layer 2: Torn Edge Effect - subtle jagged bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '8px',
            background: 'rgba(250, 248, 245, 1)',
            clipPath: 'polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)',
          }}
        />
        
        {/* Layer 3: "Continue reading" text hint - Clickable, larger, stays within bounds */}
        <button 
          className="absolute left-0 right-0 flex items-center justify-center animate-pulse-subtle hover:scale-105 transition-transform"
          style={{ 
            bottom: '8px',
            animationIterationCount: 3,
            zIndex: 51
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onScrollClick) {
              onScrollClick();
            }
          }}
          aria-label="Scroll down to continue reading"
        >
          <div className="flex items-center gap-1 px-2.5 py-0 min-h-[28px] bg-neutral-50/95 rounded-full border border-neutral-400/70 shadow-lg hover:shadow-xl hover:bg-white/95 transition-all cursor-pointer">
            <ChevronDown className="w-3 h-3 text-neutral-700" />
            <span
              className="text-neutral-800 font-semibold"
              style={{ fontSize: "clamp(0.75rem, 1.2vw, 1rem)" }}
            >
              continue reading
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-700" />
          </div>
        </button>
      </div>
    </>
  );
}

/**
 * Thin reading progress bar at top of page
 */
export function ReadingProgressBar({ 
  scrollProgress 
}: { 
  scrollProgress: number 
}) {
  return (
    <div 
      className="absolute top-0 left-0 right-0 h-0.5 bg-neutral-200/30 pointer-events-none"
      style={{ zIndex: 25 }}
    >
      <div 
        className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

/**
 * Scroll down arrow indicator (fallback/additional hint)
 */
export function ScrollArrow({ 
  show,
  position = 'left'
}: { 
  show: boolean;
  position?: 'left' | 'right';
}) {
  if (!show) return null;

  return (
    <div 
      className={`absolute bottom-4 ${position === 'left' ? 'left-4' : 'right-4'} z-40 pointer-events-none animate-bounce-gentle`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100/80 shadow-md border border-neutral-300/50">
        <ChevronDown className="w-6 h-6 text-neutral-600" />
      </div>
    </div>
  );
}

/* Add to your global CSS file or component styles */
const styles = `
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

@keyframes bounce-gentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out;
}

.animate-bounce-gentle {
  animation: bounce-gentle 2s ease-in-out infinite;
}
`;

// Export styles for use in global CSS
export const scrollIndicatorStyles = styles;

