"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
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
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    console.log("[WaveformAudioPlayer] Initializing with URL:", audioUrl);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#BFA9AB",
      progressColor: "#7C6569",
      cursorColor: "#5a4a4d",
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      height: 60,
      normalize: true,
      dragToSeek: true,
      hideScrollbar: true,
      backend: "WebAudio",
    });

    wavesurferRef.current = ws;

    // Load audio
    ws.load(audioUrl);

    // Event listeners
    ws.on("ready", () => {
      console.log("[WaveformAudioPlayer] Waveform ready");
      setIsReady(true);
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("timeupdate", (time) => setCurrentTime(time));

    ws.on("error", (error) => {
      console.error("[WaveformAudioPlayer] Error loading waveform:", error);
    });

    // Cleanup
    return () => {
      console.log("[WaveformAudioPlayer] Cleaning up");
      ws.destroy();
    };
  }, [audioUrl]);

  const onPlayPause = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  const audioDuration = wavesurferRef.current?.getDuration() || duration;

  return (
    <div className="bg-gradient-to-br from-[#f5f0f5] to-[#f8f3f8] border-2 border-[#d4c4d4] rounded-xl px-[10px] py-4 mb-6">
      {/* Title */}
      <div className="text-center mb-3">
        <p className="font-medium text-gray-900 text-lg">Your Story</p>
        <p className="text-sm text-gray-600 mt-1 text-center">
          Listen carefully - you can re-record if needed
        </p>
      </div>

      {/* Waveform Container - Reduced height */}
      <div className="mb-3 bg-white/50 rounded-lg px-[10px] py-2 border border-[#E0D9D7]">
        <div ref={containerRef} className="w-full" />

        {/* Loading state */}
        {!isReady && (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm text-center">
            Loading waveform...
          </div>
        )}
      </div>

      {/* Controls - Centered */}
      <div className="flex items-center justify-center gap-4 mb-3">
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
      <p className="text-xs text-center text-gray-500">
        Click or drag on the waveform to jump to any part
      </p>
    </div>
  );
}
