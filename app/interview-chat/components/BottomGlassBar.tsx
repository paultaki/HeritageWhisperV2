"use client";

import { StopCircle, Pause, Play, XCircle } from "lucide-react";

interface BottomGlassBarProps {
  onEnd: () => void;
  onPauseResume: () => void;
  onCancel: () => void;
  isPaused: boolean;
}

export function BottomGlassBar({ onEnd, onPauseResume, onCancel, isPaused }: BottomGlassBarProps) {
  interface ActionItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
    titleHint?: string;
  }

  const ActionItem = ({ icon, label, onClick, className = "", titleHint }: ActionItemProps) => {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-3 rounded-xl transition-colors transition-transform active:scale-95 text-[#4B5563] hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/10 ${className}`}
        aria-label={label}
        title={titleHint || label}
      >
        <div className="flex items-center justify-center w-full" style={{ height: '20px' }} aria-hidden="true">
          {icon}
        </div>
        <span className="text-[12px] font-medium tracking-tight whitespace-nowrap">{label}</span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]"
      aria-label="Recording actions"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="flex items-stretch justify-between px-2">
            <ActionItem
              icon={<StopCircle size={20} strokeWidth={1.5} />}
              label="End interview"
              onClick={onEnd}
              titleHint="End interview (Cmd/Ctrl + E)"
            />
            <ActionItem
              icon={isPaused ? <Play size={20} strokeWidth={1.5} /> : <Pause size={20} strokeWidth={1.5} />}
              label={isPaused ? "Resume" : "Pause"}
              onClick={onPauseResume}
              titleHint="Pause / Resume (Space)"
            />
            <ActionItem
              icon={<XCircle size={20} strokeWidth={1.5} />}
              label="Cancel"
              onClick={onCancel}
              titleHint="Cancel (Esc)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
