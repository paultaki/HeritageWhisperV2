"use client";

import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  reduceMotion?: boolean;
}

export function TypingIndicator({ reduceMotion = false }: TypingIndicatorProps) {
  // Hook to detect prefers-reduced-motion if not provided
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (reduceMotion === undefined) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onChange = () => setPrefersReduced(mq.matches);
      onChange();
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, [reduceMotion]);

  const shouldReduceMotion = reduceMotion ?? prefersReduced;

  return (
    <div className="flex justify-start">
      <div className="max-w-[78%]">
        {/* Sender label */}
        <div className="mb-1 px-3 text-[13px] font-medium text-slate-600">
          Pearl
        </div>
        {/* Bubble with typing dots */}
        <div
          className="rounded-2xl px-4 py-3 shadow-sm ring-1 bg-[#E8D5F2] text-[#2C2C2C] ring-[#8B5CF6]/30"
          role="status"
          aria-label="Pearl is typing"
        >
          <div className="flex items-center gap-1 text-[#6B7280]">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-current opacity-70 ${!shouldReduceMotion ? 'animate-pulse' : ''}`}
              style={{ animationDelay: "0ms" }}
            />
            <span
              className={`h-1.5 w-1.5 rounded-full bg-current opacity-70 ${!shouldReduceMotion ? 'animate-pulse' : ''}`}
              style={{ animationDelay: "150ms" }}
            />
            <span
              className={`h-1.5 w-1.5 rounded-full bg-current opacity-70 ${!shouldReduceMotion ? 'animate-pulse' : ''}`}
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
