"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface CustomAudioPlayerProps {
  audioUrl: string;
  duration: number; // Duration in seconds from recording
}

/**
 * Modern, minimal audio player with clean progress bar
 * Removes confusing play icon and uses actual HTML5 audio controls
 */
export function CustomAudioPlayer({ audioUrl, duration }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds);
    const secs = Math.floor((seconds % 1) * 60);
    return `${Math.floor(mins / 60)}:${(mins % 60).toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Handle progress bar click for seeking
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const progressPercent = (currentTime / audioDuration) * 100;

  return (
    <div className="bg-gradient-to-br from-[#f5f0f5] to-[#f8f3f8] border-2 border-[#d4c4d4] rounded-xl p-6 mb-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title */}
      <div className="text-center mb-4">
        <p className="font-medium text-gray-900 text-lg">Your Story</p>
        <p className="text-sm text-gray-600 mt-1">Listen carefully - you can re-record if needed</p>
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-4 mb-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#8b6b7a] to-[#b88b94] flex items-center justify-center hover:brightness-110 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#8b6b7a]/30"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-white" />
          ) : (
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="relative h-2 bg-[#E0D9D7] rounded-full cursor-pointer hover:h-2.5 transition-all group"
          >
            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8b6b7a] to-[#b88b94] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Hover handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#8b6b7a] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>

          {/* Time stamps */}
          <div className="flex items-center justify-between mt-1.5 text-xs text-gray-600 tabular-nums font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
