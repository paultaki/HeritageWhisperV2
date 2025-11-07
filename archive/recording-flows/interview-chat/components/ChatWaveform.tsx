"use client";

import { useEffect, useState } from "react";

interface ChatWaveformProps {
  isActive: boolean;
  isPearl?: boolean;
  getMicStream?: () => MediaStream | null;
}

export function ChatWaveform({ isActive, isPearl = false, getMicStream }: ChatWaveformProps) {
  const [barHeights, setBarHeights] = useState<number[]>(Array(16).fill(0.2));

  useEffect(() => {
    if (!isActive || !getMicStream) {
      // Set bars to minimum height when inactive
      setBarHeights(Array(16).fill(0.2));
      return;
    }

    const micStream = getMicStream();
    if (!micStream) {
      console.warn('[ChatWaveform] No microphone stream available');
      setBarHeights(Array(16).fill(0.2));
      return;
    }

    // Create Web Audio API context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32; // 16 frequency bins (perfect for our 16 bars!)
    analyser.smoothingTimeConstant = 0.8; // Smooth transitions

    // Connect microphone stream to analyzer
    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);

    // Array to hold frequency data
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Animation loop to update bar heights based on real audio
    let animationId: number;
    const updateBars = () => {
      // Get frequency data from analyzer
      analyser.getByteFrequencyData(dataArray);

      // Map frequency data to bar heights
      const newHeights = Array.from({ length: 16 }, (_, i) => {
        // Get frequency value (0-255)
        const value = dataArray[i] || 0;

        // Normalize to 0-1 range, then scale to our desired range (0.2-0.9)
        const normalized = value / 255;
        const scaled = 0.2 + (normalized * 0.7);

        // Add center boost (vocal frequencies tend to be in middle range)
        const centerBoost = 1 - Math.abs(i - 8) / 12;
        const boosted = scaled * (0.7 + centerBoost * 0.3);

        return Math.max(0.2, Math.min(0.9, boosted));
      });

      setBarHeights(newHeights);
      animationId = requestAnimationFrame(updateBars);
    };

    updateBars();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [isActive, getMicStream]);

  const gradientClass = isPearl
    ? 'bg-gradient-to-b from-purple-500 via-purple-400 to-indigo-500'
    : 'bg-gradient-to-b from-slate-400 via-slate-300 to-slate-400';

  return (
    <div className="flex items-center justify-center gap-1 px-2 py-3 min-h-[60px]">
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="relative flex items-center"
          style={{
            width: '3px',
            height: '40px',
          }}
        >
          <div
            className={'w-full rounded-full transition-all duration-150 ease-out ' + gradientClass}
            style={{
              height: height * 100 + '%',
              opacity: isActive ? 0.9 : 0.4,
            }}
          />
        </div>
      ))}
    </div>
  );
}
