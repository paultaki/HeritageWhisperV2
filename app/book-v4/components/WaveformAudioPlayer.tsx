"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause } from "lucide-react";

type WaveformAudioPlayerProps = {
  src: string;
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
};

/**
 * Waveform Audio Player
 *
 * Premium SoundCloud-style audio player with waveform visualization.
 * Uses wavesurfer.js for real audio peak visualization.
 *
 * Features:
 * - Real waveform from audio file peaks
 * - Click-to-seek on waveform
 * - Progress color fills waveform
 * - Sepia/Gold theme from CSS variables
 * - Circular play/pause button with gradient
 * - Tabular-nums time display
 * - Keyboard accessible (Space to play/pause)
 *
 * Theming:
 * - Uses --book-accent and --book-accent-light CSS vars
 * - Automatically adapts to sepia or gold theme
 */
export default function WaveformAudioPlayer({
  src,
  className = "",
  onPlayStateChange
}: WaveformAudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<import("wavesurfer.js").default | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get CSS variable value for theme colors
  const getThemeColor = useCallback((varName: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return value || fallback;
  }, []);

  // Initialize wavesurfer
  useEffect(() => {
    if (!waveformRef.current || !src) return;

    let ws: import("wavesurfer.js").default | null = null;

    const initWavesurfer = async () => {
      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;

        // Get theme colors
        const progressColor = getThemeColor("--book-accent", "#8B7355");
        const waveColor = getThemeColor("--book-accent-light", "rgba(139, 115, 85, 0.3)");

        ws = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: waveColor,
          progressColor: progressColor,
          cursorColor: "transparent",
          barWidth: 3,
          barGap: 2,
          barRadius: 3,
          height: 40,
          normalize: true,
          hideScrollbar: true,
          interact: true,
        });

        ws.load(src);

        ws.on("ready", () => {
          setDuration(ws?.getDuration() || 0);
          setIsLoaded(true);
          setIsLoading(false);
        });

        ws.on("audioprocess", () => {
          setCurrentTime(ws?.getCurrentTime() || 0);
        });

        ws.on("seeking", () => {
          setCurrentTime(ws?.getCurrentTime() || 0);
        });

        ws.on("play", () => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        });

        ws.on("pause", () => {
          setIsPlaying(false);
          onPlayStateChange?.(false);
        });

        ws.on("finish", () => {
          setIsPlaying(false);
          onPlayStateChange?.(false);
        });

        ws.on("error", (e) => {
          console.error("WaveSurfer error:", e);
          setIsLoading(false);
        });

        wavesurfer.current = ws;
      } catch (error) {
        console.error("Failed to initialize WaveSurfer:", error);
        setIsLoading(false);
      }
    };

    initWavesurfer();

    return () => {
      if (ws) {
        ws.destroy();
      }
    };
  }, [src, getThemeColor, onPlayStateChange]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  }, []);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      togglePlay();
    }
  }, [togglePlay]);

  return (
    <div
      className={`book-audio-player ${className}`}
      role="region"
      aria-label="Audio player"
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        onKeyDown={handleKeyDown}
        disabled={!isLoaded}
        className="book-audio-button"
        aria-label={isPlaying ? "Pause" : "Play"}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform Container */}
      <div
        ref={waveformRef}
        className="book-audio-waveform"
        aria-hidden="true"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-current opacity-20 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 24 + 8}px`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Time Display */}
      <div className="book-audio-time" aria-live="polite">
        <span aria-label={`Current time ${formatTime(currentTime)}`}>
          {formatTime(currentTime)}
        </span>
        <span aria-hidden="true"> / </span>
        <span aria-label={`Duration ${formatTime(duration)}`}>
          {formatTime(duration)}
        </span>
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`book-audio-player ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        className="book-audio-button"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Simple progress bar fallback */}
      <div className="book-audio-waveform relative">
        <div className="absolute inset-0 bg-[var(--book-accent-light)] rounded-full" />
        <div
          className="absolute inset-y-0 left-0 bg-[var(--book-accent)] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="book-audio-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}
