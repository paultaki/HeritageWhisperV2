/**
 * TimelineNearEndNudge Component
 *
 * Small sticky pill that appears when user is near the end of timeline
 * Shows within ~2 screens of the bottom
 */

"use client";

import React, { useState, useEffect, useRef } from "react";

type TimelineNearEndNudgeProps = {
  onAddMemory?: () => void;
};

export function TimelineNearEndNudge({
  onAddMemory,
}: TimelineNearEndNudgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const endSentinel = document.querySelector("#timeline-end");
    if (!endSentinel) return;

    // Show nudge when within 40% of the end sentinel entering viewport
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.4 }
    );

    observerRef.current.observe(endSentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={onAddMemory}
      className="fixed left-1/2 -translate-x-1/2 z-30
                 rounded-full px-4 h-10
                 bg-gray-900 text-white text-sm shadow-lg
                 flex items-center gap-2
                 transition-all duration-300
                 hover:bg-gray-800 active:scale-95
                 focus:outline-none focus:ring-2 focus:ring-blue-300
                 whitespace-nowrap"
      style={{
        bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
        minWidth: "auto",
        width: "auto",
      }}
      aria-label="Add a memory"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      Add a memory
    </button>
  );
}
