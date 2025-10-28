"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Play, Pause } from "lucide-react";

interface WaveformAudioPlayerProps {
  audioUrl: string;
  duration: number; // Duration in seconds from recording
}

/**
 * Modern waveform audio player with draggable cursor
 * Shows audio amplitude visualization like clinical audio recorders
 */
export function WaveformAudioPlayer({ audioUrl, duration }: WaveformAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Memoize onReady callback to prevent recreating on every render
  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  // Memoize wavesurfer options to prevent infinite re-renders
  const wavesurferOptions = useMemo(() => ({
    container: containerRef,
    url: audioUrl,
    waveColor: "#BFA9AB", // Lighter mauve for background
    progressColor: "#7C6569", // Darker mauve for progress
    cursorColor: "#5a4a4d", // Dark cursor
    cursorWidth: 2,
    barWidth: 3,
    barGap: 2,
    barRadius: 2,
    height: 80,
    normalize: true,
    dragToSeek: true, // Enable click/drag to seek
    hideScrollbar: true,
    mediaControls: false,
    onReady: handleReady,
  }), [audioUrl, handleReady]);

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer(wavesurferOptions);

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause();
  }, [wavesurfer]);

  const audioDuration = wavesurfer?.getDuration() || duration;

  return (
    <div className="bg-gradient-to-br from-[#f5f0f5] to-[#f8f3f8] border-2 border-[#d4c4d4] rounded-xl p-6 mb-6">
      {/* Title */}
      <div className="text-center mb-4">
        <p className="font-medium text-gray-900 text-lg">Your Story</p>
        <p className="text-sm text-gray-600 mt-1">
          Listen carefully - you can re-record if needed
        </p>
      </div>

      {/* Waveform Container */}
      <div className="mb-4 bg-white/50 rounded-lg p-3 border border-[#E0D9D7]">
        <div ref={containerRef} className="w-full" />

        {/* Loading state */}
        {!isReady && (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
            Loading waveform...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          disabled={!isReady}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#8b6b7a] to-[#b88b94] flex items-center justify-center hover:brightness-110 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#8b6b7a]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-white" />
          ) : (
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          )}
        </button>

        {/* Time Display */}
        <div className="flex items-center gap-2 text-sm text-gray-600 tabular-nums font-mono">
          <span>{formatTime(currentTime)}</span>
          <span className="text-gray-400">/</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-xs text-center text-gray-500 mt-3">
        Click or drag on the waveform to jump to any part
      </p>
    </div>
  );
}
