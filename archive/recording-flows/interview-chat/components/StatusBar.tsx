"use client";

import { Mic } from "lucide-react";

interface StatusBarProps {
  listening: boolean;
  seconds: number;
  onToggle: () => void;
  reduceMotion?: boolean;
}

export function StatusBar({ listening, seconds, onToggle, reduceMotion = false }: StatusBarProps) {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="w-full sticky top-0 z-40">
      <div className="px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-white border-b border-[#E5E5E5]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Left — Listening / Paused */}
          <button
            aria-label={listening ? "Listening. Tap to pause" : "Paused. Tap to resume"}
            aria-pressed={listening}
            onClick={onToggle}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/10 rounded-md"
            title={listening ? "Pause (Space)" : "Resume (Space)"}
          >
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full shadow ring-1 ring-inset ${
                listening
                  ? `${!reduceMotion ? "animate-pulse" : ""}`
                  : "bg-amber-400 shadow-amber-500/40 ring-amber-400/40"
              }`}
              style={
                listening
                  ? {
                      background: "#10B981",
                      boxShadow: "0 0 0 2px rgba(16,185,129,0.25)",
                      borderColor: "rgba(16,185,129,0.4)",
                    }
                  : undefined
              }
            />
            <span className="text-[15px] font-medium tracking-tight">
              {listening ? "Listening" : "Paused"}
            </span>
          </button>

          {/* Right — Mic + Timer */}
          <div className="flex items-center gap-2">
            <Mic
              strokeWidth={1.5}
              className="h-5 w-5 text-[#6B7280]"
              aria-hidden="true"
            />
            <span
              className="tabular-nums text-[15px] font-medium tracking-tight text-[#8B5CF6]"
              aria-live="polite"
            >
              {formatTime(seconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
