"use client";

import { useEffect, useRef, useState } from "react";

const TIPS = [
  {
    icon: "📅",
    text: "Start with when and where—it anchors your memory"
  },
  {
    icon: "👤",
    text: "Name the people—their names matter to your family"
  },
  {
    icon: "❤️",
    text: "Share how you felt—that's what they'll remember"
  },
  {
    icon: "🎯",
    text: "One story, one moment—don't try to tell everything"
  }
];

export default function PreRecordHints() {
  const [idx, setIdx] = useState(0);
  const [reduced, setReduced] = useState(false);
  const fadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReduced(!!m?.matches);
    const handler = () => setReduced(!!m?.matches);
    m?.addEventListener?.("change", handler);
    return () => m?.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (fadeRef.current) {
        fadeRef.current.style.opacity = "0";
        setTimeout(() => {
          setIdx((i) => (i + 1) % TIPS.length);
          if (fadeRef.current) fadeRef.current.style.opacity = "1";
        }, 300);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="mx-auto w-full max-w-sm px-4">
      <div
        className="mt-3 rounded-2xl border border-[#e8ddd5] bg-white/80 p-4 shadow-sm backdrop-blur-sm"
        role="region"
        aria-label="Recording tips and privacy"
      >
        {/* Row 1: Micro-tip */}
        <div
          ref={fadeRef}
          className="flex items-center gap-3 transition-opacity duration-300"
          role="status"
          aria-live="polite"
        >
          <span className="text-2xl leading-6 flex-shrink-0" aria-hidden="true">
            {TIPS[idx].icon}
          </span>
          <p className="text-[22px] leading-7 text-[#2d2520]">
            {TIPS[idx].text}
          </p>
        </div>

        {/* Hairline divider */}
        <div className="my-3 h-px w-full bg-[#e8ddd5]" />

        {/* Row 2: Privacy */}
        <div className="flex items-center gap-3">
          <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-[#6b7280]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8V7a5 5 0 0 0-10 0v1H5a1 1 0 0 0-1 1v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9a1 1 0 0 0-1-1h-2Zm-8 0V7a3 3 0 0 1 6 0v1H9Z"/>
          </svg>
          <p className="text-[21px] leading-7 text-[#5a4a3a]">
            Private by default. You choose what to share.
          </p>
        </div>

      </div>
    </div>
  );
}
