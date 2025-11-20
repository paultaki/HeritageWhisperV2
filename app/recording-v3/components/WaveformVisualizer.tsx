"use client";

import { useEffect, useState } from "react";
import "../recording-v3.css";

type WaveformVisualizerProps = {
  isRecording: boolean;
  audioLevel: number;
};

/**
 * WaveformVisualizer - Animated waveform bars
 * Responds to real-time audio level from AudioContext analyser
 * Based on heritage-whisper-recorder reference implementation
 */
export function WaveformVisualizer({
  isRecording,
  audioLevel,
}: WaveformVisualizerProps) {
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(12).fill(0.2)
  );

  useEffect(() => {
    if (!isRecording) {
      // Reset to idle state when not recording
      setBarHeights(Array(12).fill(0.2));
      return;
    }

    // Animate bars based on audio level
    const interval = setInterval(() => {
      setBarHeights((prev) =>
        prev.map((_, index) => {
          // Create wave pattern with some randomness
          const baseHeight = 0.2 + audioLevel * 0.6;
          const waveOffset = Math.sin((Date.now() / 300) + (index * 0.5)) * 0.15;
          const randomness = Math.random() * 0.1;
          return Math.max(0.15, Math.min(0.95, baseHeight + waveOffset + randomness));
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, audioLevel]);

  return (
    <div className="hw-waveform">
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="hw-waveform-bar"
          style={{
            height: `${height * 80}px`,
            backgroundColor: isRecording
              ? "var(--hw-recording-active)"
              : "var(--hw-gray-300)",
          }}
        />
      ))}
    </div>
  );
}
