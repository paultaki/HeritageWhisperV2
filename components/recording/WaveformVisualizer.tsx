"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";

interface WaveformVisualizerProps {
  frequencyData: number[];
  isRecording: boolean;
  isPaused: boolean;
  decibelLevel?: number;
  className?: string;
}

/**
 * Ambient waveform visualizer with 28 animated bars.
 * Features subtle glow effects, edge fading, and breathing animations.
 * 
 * Design matches the Whisper Recorder aesthetic:
 * - Low amplitude (subtle, non-intrusive)
 * - Soft colors (#7C6569 foreground, #BFA9AB glow)
 * - Edge fade masking for professional look
 * - Smooth animations (4-5s durations)
 */
export function WaveformVisualizer({
  frequencyData,
  isRecording,
  isPaused,
  decibelLevel = -42,
  className = "",
}: WaveformVisualizerProps) {
  const barCount = 28;

  // Group frequency data into 28 bins for our bars
  const barHeights = useMemo(() => {
    if (!frequencyData.length) {
      // Default static heights when no data
      return Array.from({ length: barCount }, () => 0.15);
    }

    const binsPerBar = Math.floor(frequencyData.length / barCount);
    return Array.from({ length: barCount }, (_, i) => {
      const startBin = i * binsPerBar;
      const endBin = startBin + binsPerBar;
      const barData = frequencyData.slice(startBin, endBin);
      const avg = barData.reduce((sum, val) => sum + val, 0) / barData.length;
      
      // Scale for ambient aesthetic (keep low amplitude: 8-32px range in 80px container)
      // Target: 10-40% of container height for ambient feel
      return Math.max(0.1, Math.min(0.5, avg * 1.5));
    });
  }, [frequencyData]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Input label and Live indicator */}
      <div className="mb-2 flex items-center justify-between text-[13px] text-[#99898C]">
        <div>Input: Internal Mic</div>
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 items-center justify-center">
            {isRecording && !isPaused && (
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-[#7C6569]"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            {isPaused && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#99898C]" />
            )}
          </span>
          {isRecording && !isPaused ? "Live" : isPaused ? "Paused" : "Ready"}
        </div>
      </div>

      {/* Waveform container */}
      <div className="relative w-full overflow-hidden rounded-lg border border-[#E0D9D7] bg-[#FAF8F6] p-3 ring-1 ring-inset ring-[#E0D9D7]">
        <svg
          viewBox="0 0 224 80"
          className="h-28 w-full sm:h-32 md:h-36"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Edge fade gradient */}
            <linearGradient id="edgeFade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="12%" stopColor="white" stopOpacity="1" />
              <stop offset="88%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Mask for edge fading */}
            <mask id="maskFade">
              <rect x="0" y="0" width="100%" height="100%" fill="url(#edgeFade)" />
            </mask>

            {/* Soft glow filter */}
            <filter id="softGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
              </feMerge>
            </filter>
          </defs>

          {/* Glow layer (blurred background) */}
          <g mask="url(#maskFade)" filter="url(#softGlow)" opacity="0.18" fill="#BFA9AB">
            {Array.from({ length: barCount }).map((_, i) => {
              const x = i * 8;
              const centerY = 40;
              const amplitude = isPaused ? 0.15 : (barHeights[i] || 0.15);
              const height = amplitude * 80; // Scale to viewBox height
              const y = centerY - height / 2;

              return (
                <rect
                  key={`glow-${i}`}
                  x={x}
                  y={isPaused ? 36 : y}
                  width="4"
                  height={isPaused ? 8 : height}
                  rx="2"
                >
                  {isRecording && !isPaused && (
                    <animate
                      attributeName="y"
                      values={`${y};${y - 6};${y};${y + 2};${y}`}
                      dur={`${4 + (i % 10) * 0.1}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.08}s`}
                    />
                  )}
                  {isRecording && !isPaused && (
                    <animate
                      attributeName="height"
                      values={`${height};${height + 12};${height};${height + 4};${height}`}
                      dur={`${4 + (i % 10) * 0.1}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.08}s`}
                    />
                  )}
                </rect>
              );
            })}
          </g>

          {/* Foreground bars (crisp) */}
          <g mask="url(#maskFade)" fill="#7C6569">
            {Array.from({ length: barCount }).map((_, i) => {
              const x = i * 8;
              const centerY = 40;
              const amplitude = isPaused ? 0.15 : (barHeights[i] || 0.15);
              const height = amplitude * 80;
              const y = centerY - height / 2;

              return (
                <rect
                  key={`bar-${i}`}
                  x={x}
                  y={isPaused ? 36 : y}
                  width="4"
                  height={isPaused ? 8 : height}
                  rx="2"
                  opacity="0.55"
                >
                  {isRecording && !isPaused && (
                    <animate
                      attributeName="y"
                      values={`${y};${y - 6};${y};${y + 2};${y}`}
                      dur={`${4 + (i % 10) * 0.1}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.08}s`}
                    />
                  )}
                  {isRecording && !isPaused && (
                    <animate
                      attributeName="height"
                      values={`${height};${height + 12};${height};${height + 4};${height}`}
                      dur={`${4 + (i % 10) * 0.1}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.08}s`}
                    />
                  )}
                </rect>
              );
            })}
          </g>
        </svg>

        {/* Inner border ring */}
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-[#E0D9D7]" />
      </div>

      {/* Audio level display */}
      <div className="mt-3 text-[13px] text-[#99898C]">
        Level: {decibelLevel} dB
      </div>
    </div>
  );
}
