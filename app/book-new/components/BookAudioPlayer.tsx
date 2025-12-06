"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { BookAudioPlayerProps } from "./types";

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function BookAudioPlayer({
  audioUrl,
  durationSeconds,
  onPlayStateChange,
}: BookAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // Use durationSeconds from database as initial value (fixes 0:00 display for recorded audio)
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [isDragging, setIsDragging] = useState(false);

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

    const dur = audioRef.current.duration || 0;
    const cur = Math.max(0, audioRef.current.currentTime || 0);

    setDuration(dur);
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
    if (!audioRef.current || !isFinite(audioRef.current.duration)) return;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
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

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className="relative grid h-12 w-12 flex-shrink-0 place-items-center rounded-full text-white transition active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #8B7355 0%, #9f8a6c 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" fill="currentColor" />
        ) : (
          <Play className="h-6 w-6" fill="currentColor" />
        )}
      </button>

      {/* Progress bar and time */}
      <div className="flex flex-1 flex-col" style={{ marginTop: '16px', marginRight: '15px' }}>
        {/* Scrub bar */}
        <div
          ref={scrubBarRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="relative h-3 cursor-pointer rounded-full bg-[#8B7355]/20"
        >
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#8B7355] transition-all"
            style={{ width: `${progressPercentage}%` }}
          ></div>

          {/* Thumb */}
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-[#8B7355]/40 transition-all"
            style={{ left: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Time display */}
        <div className="mt-1 flex justify-end text-xs text-stone-500">
          <span>
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
