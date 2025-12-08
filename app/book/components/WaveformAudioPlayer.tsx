"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause } from "lucide-react";

type WaveformAudioPlayerProps = {
  src: string;
  durationSeconds?: number; // Pre-loaded duration from database (fixes 0:00 display for recorded audio)
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
  autoplay?: boolean; // Auto-start playback when component mounts (for Timeline → Book View transition)
};

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Simple Audio Player
 *
 * Clean, sleek audio player with scrubber bar.
 * Uses CSS variables for sepia/gold theming.
 *
 * Features:
 * - Draggable progress scrubber
 * - Click-to-seek on progress bar
 * - Circular play/pause button with gradient
 * - Tabular-nums time display
 * - Keyboard accessible (Space to play/pause)
 */
export default function WaveformAudioPlayer({
  src,
  durationSeconds,
  className = "",
  onPlayStateChange,
  autoplay = false
}: WaveformAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // Use durationSeconds from database as initial value (fixes 0:00 display for recorded audio)
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [isDragging, setIsDragging] = useState(false);

  // Ref to track duration without causing callback recreation
  const durationRef = useRef(duration);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Sync duration state when durationSeconds prop changes (e.g., after fresh data is fetched)
  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  // Update progress
  const updateProgress = useCallback(() => {
    if (!audioRef.current) return;

    const dur = audioRef.current.duration;
    const cur = Math.max(0, audioRef.current.currentTime || 0);

    // Once browser loads valid metadata, use it (more accurate than database for WebM files)
    // This fixes old recordings saved with duration=1 that should have real durations
    if (dur && isFinite(dur) && dur > 0) {
      setDuration(dur);
    } else if (cur > durationRef.current) {
      // Fallback: if currentTime exceeds our known duration, update duration
      // This handles WebM files where duration metadata is Infinity
      setDuration(cur);
    }
    setCurrentTime(cur);
  }, []);

  // Calculate percentage from mouse/touch event
  const getPercentageFromEvent = useCallback(
    (e: MouseEvent | TouchEvent): number => {
      if (!scrubBarRef.current) return 0;

      const rect = scrubBarRef.current.getBoundingClientRect();
      const clientX =
        e instanceof TouchEvent ? e.touches[0]?.clientX : e.clientX;

      if (!clientX) return 0;

      const x = clientX - rect.left;
      return Math.min(1, Math.max(0, x / rect.width));
    },
    []
  );

  // Seek to specific percentage
  const seekToPercentage = useCallback((percentage: number) => {
    if (!audioRef.current) return;
    // Use our known duration since browser may report Infinity for WebM files
    const knownDuration = durationRef.current;
    if (!knownDuration || knownDuration <= 0) return;
    audioRef.current.currentTime = percentage * knownDuration;
  }, []);

  // Start dragging
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const nativeEvent = e.nativeEvent;
      const percentage = getPercentageFromEvent(
        nativeEvent as MouseEvent | TouchEvent
      );
      seekToPercentage(percentage);
      updateProgress();
    },
    [getPercentageFromEvent, seekToPercentage, updateProgress]
  );

  // Dragging
  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const percentage = getPercentageFromEvent(e);
      seekToPercentage(percentage);
      updateProgress();
    },
    [isDragging, getPercentageFromEvent, seekToPercentage, updateProgress]
  );

  // End dragging
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up global drag listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
      updateProgress();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);
    audio.addEventListener("ended", handleEnded);

    // Initial update
    setTimeout(updateProgress, 50);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onPlayStateChange, updateProgress]);

  // Autoplay effect - triggers playback when autoplay prop is true
  useEffect(() => {
    if (autoplay && audioRef.current && !isPlaying) {
      // Small delay to ensure audio is ready
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            // Silently fail if browser blocks autoplay (common on mobile without user gesture)
            console.log('[WaveformAudioPlayer] Autoplay blocked by browser:', error.message);
          });
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [autoplay]); // Only trigger on autoplay change, not isPlaying

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      togglePlay();
    }
  }, [togglePlay]);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role="region"
      aria-label="Audio player"
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        onKeyDown={handleKeyDown}
        className="relative grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-white transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--book-accent, #8B7355) 0%, color-mix(in srgb, var(--book-accent, #8B7355) 80%, white) 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Progress bar and time */}
      <div className="flex flex-1 flex-col" style={{ marginTop: '15px' }}>
        {/* Scrub bar */}
        <div
          ref={scrubBarRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="relative h-2.5 cursor-pointer rounded-full"
          style={{ backgroundColor: 'var(--book-accent-light, rgba(139, 115, 85, 0.3))' }}
        >
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: 'var(--book-accent, #8B7355)'
            }}
          />

          {/* Thumb */}
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-all"
            style={{
              left: `${progressPercentage}%`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.2), 0 0 0 1px var(--book-accent-light, rgba(139, 115, 85, 0.3))'
            }}
          />
        </div>

        {/* Time display */}
        <div
          className="mt-1 flex justify-end text-[11px] tabular-nums"
          style={{ color: 'var(--book-text-muted, #6B6460)' }}
        >
          <span aria-live="polite">
            <span aria-label={`Current time ${formatTime(currentTime)}`}>
              {formatTime(currentTime)}
            </span>
            <span aria-hidden="true"> / </span>
            <span aria-label={`Duration ${formatTime(duration)}`}>
              {formatTime(duration)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple fallback audio player without waveform
 * For older browsers or when wavesurfer fails to load
 */
export function SimpleAudioPlayer({
  src,
  className = ""
}: {
  src: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        className="relative grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-white transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--book-accent, #8B7355) 0%, color-mix(in srgb, var(--book-accent, #8B7355) 80%, white) 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Simple progress bar fallback */}
      <div className="flex flex-1 flex-col">
        <div
          className="relative h-2.5 rounded-full"
          style={{ backgroundColor: 'var(--book-accent-light, rgba(139, 115, 85, 0.3))' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--book-accent, #8B7355)'
            }}
          />
        </div>

        <div
          className="mt-1 flex justify-end text-[11px] tabular-nums"
          style={{ color: 'var(--book-text-muted, #6B6460)' }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
