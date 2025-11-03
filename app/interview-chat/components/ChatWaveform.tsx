"use client";

import { useEffect, useRef, useState } from "react";

interface ChatWaveformProps {
  isActive: boolean;
  isPearl?: boolean; // For color theming
}

/**
 * Premium waveform visualizer for chat bubbles
 * Features:
 * - Simple vertical bars with rounded edges
 * - Expands from center (top and bottom)
 * - Smooth animations with staggered timing
 * - Purple gradient for Pearl, gray for user
 * - Compact design for inline chat display
 */
export function ChatWaveform({ isActive, isPearl = false }: ChatWaveformProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array>(new Uint8Array(16));
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Web Audio API for user microphone
  useEffect(() => {
    if (!isPearl && isActive) {
      // Only capture mic for user bubbles
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const ctx = new AudioContext();
          const analyserNode = ctx.createAnalyser();
          analyserNode.fftSize = 32; // 16 frequency bins (simple waveform)
          analyserNode.smoothingTimeConstant = 0.8;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyserNode);

          setAudioContext(ctx);
          setAnalyser(analyserNode);
          setDataArray(new Uint8Array(analyserNode.frequencyBinCount));
        } catch (err) {
          console.error('[ChatWaveform] Failed to access microphone:', err);
        }
      };

      initAudio();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isActive, isPearl, audioContext]);

  // Animation loop to update frequency data
  useEffect(() => {
    if (!analyser || !isActive) return;

    const updateWaveform = () => {
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buffer);
      setDataArray(buffer);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isActive]);

  // Calculate bar heights (16 bars, normalized 0-1)
  const barHeights = Array.from({ length: 16 }, (_, i) => {
    if (!isActive || !analyser) {
      // Idle state: gentle random heights
      return 0.2 + Math.sin(Date.now() / 1000 + i) * 0.1;
    }
    // Active state: map frequency data
    const normalized = (dataArray[i] || 0) / 255;
    return Math.max(0.15, Math.min(0.85, normalized * 1.2));
  });

  return (
    <div className="flex items-center justify-center gap-1 px-2 py-3 min-h-[60px]">
      {barHeights.map((height, index) => {
        // Stagger animation delays for wave effect
        const delay = index * 0.05;

        return (
          <div
            key={index}
            className="relative flex items-center"
            style={{
              width: '3px',
              height: '40px',
            }}
          >
            <div
              className={`w-full rounded-full transition-all duration-300 ease-out ${
                isPearl
                  ? 'bg-gradient-to-b from-purple-500 via-purple-400 to-indigo-500'
                  : 'bg-gradient-to-b from-slate-400 via-slate-300 to-slate-400'
              }`}
              style={{
                height: `${height * 100}%`,
                transitionDelay: `${delay}s`,
                opacity: isActive ? 0.9 : 0.4,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
