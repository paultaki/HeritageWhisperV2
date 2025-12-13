"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { formatDuration } from "@/lib/audioSlicer";

interface AudioSegmentPlayerProps {
  url: string;
  durationSeconds: number;
  disabled?: boolean;
}

export function AudioSegmentPlayer({
  url,
  durationSeconds,
  disabled = false,
}: AudioSegmentPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    if (disabled) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${disabled ? "opacity-50" : ""}`}>
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={togglePlayPause}
          disabled={disabled}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            ${isPlaying
              ? "bg-[var(--hw-primary)] text-white"
              : "bg-[var(--hw-primary-soft)] text-[var(--hw-primary)]"
            }
            transition-colors
          `}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 relative">
            {/* Track background */}
            <div className="h-2 bg-[var(--hw-section-bg)] rounded-full overflow-hidden">
              {/* Progress fill */}
              <div
                className="h-full bg-[var(--hw-primary)] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Range input (invisible, for interaction) */}
            <input
              type="range"
              min="0"
              max={duration || durationSeconds}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Seek"
            />
          </div>

          {/* Time display */}
          <span className="text-sm font-medium text-[var(--hw-text-secondary)] tabular-nums min-w-[70px] text-right">
            {formatDuration(currentTime)} / {formatDuration(duration || durationSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
