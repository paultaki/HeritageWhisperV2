"use client";

import React from "react";
import { Loader2, Mic, Sparkles, Wand2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProcessingStatusType =
  | "uploading"
  | "enhancing"
  | "transcribing"
  | "extracting"
  | "complete";

interface ProcessingStatusProps {
  status: ProcessingStatusType;
  type: "audio" | "transcription";
  className?: string;
}

const STATUS_CONFIG = {
  audio: {
    uploading: {
      icon: Mic,
      message: "Listening to your story...",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    enhancing: {
      icon: Sparkles,
      message: "Enhancing your audio...",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    complete: {
      icon: CheckCircle2,
      message: "Audio ready!",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  },
  transcription: {
    transcribing: {
      icon: Wand2,
      message: "Transcribing your story...",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    extracting: {
      icon: Sparkles,
      message: "Extracting insights...",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    complete: {
      icon: CheckCircle2,
      message: "Transcription ready!",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  },
};

export function ProcessingStatus({
  status,
  type,
  className,
}: ProcessingStatusProps) {
  const config = STATUS_CONFIG[type][status as keyof typeof STATUS_CONFIG[typeof type]];

  if (!config) {
    // Fallback for uploading status on transcription type
    const fallbackConfig = {
      icon: Loader2,
      message: "Processing...",
      color: "text-[#8B7355]",
      bgColor: "bg-[#FAF8F6]",
    };
    
    const Icon = fallbackConfig.icon;
    
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg border border-[#E8DDD3]",
          fallbackConfig.bgColor,
          className
        )}
      >
        <Loader2 className={cn("w-5 h-5 animate-spin", fallbackConfig.color)} />
        <span className={cn("text-sm font-medium", fallbackConfig.color)}>
          {fallbackConfig.message}
        </span>
      </div>
    );
  }

  const Icon = config.icon;
  const isComplete = status === "complete";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border border-[#E8DDD3]",
        config.bgColor,
        className
      )}
    >
      {isComplete ? (
        <Icon className={cn("w-5 h-5", config.color)} />
      ) : (
        <div className="relative">
          <Icon className={cn("w-5 h-5 animate-pulse", config.color)} />
          <div className={cn("absolute inset-0 animate-ping opacity-75")}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
        </div>
      )}
      <span className={cn("text-sm font-medium", config.color)}>
        {config.message}
      </span>
    </div>
  );
}
