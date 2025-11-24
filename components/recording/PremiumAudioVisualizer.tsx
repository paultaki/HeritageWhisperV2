"use client";

import { useEffect, useRef } from "react";

type PremiumAudioVisualizerProps = {
  /** Audio stream from microphone (optional if frequencyData provided) */
  audioStream?: MediaStream | null;
  /** Pre-computed frequency data from external analyzer (optional if audioStream provided) */
  frequencyData?: number[];
  /** Recording state */
  isRecording: boolean;
  /** Paused state */
  isPaused?: boolean;
  /** Optional custom color (defaults to design system colors) */
  activeColor?: string;
  idleColor?: string;
  /** Optional className for container */
  className?: string;
};

/**
 * PremiumAudioVisualizer - Minimalist Apple/Notion-style audio visualizer
 *
 * Features:
 * - Real-time FFT frequency analysis (actual audio data)
 * - Smooth 60fps Canvas rendering (no React re-renders)
 * - Minimalist design with design system colors
 * - High performance with automatic cleanup
 * - Center-aligned bars with smooth interpolation
 *
 * Design specs:
 * - 32 bars, 3px width, 6px gap
 * - 60px height container
 * - Rounded bar caps
 * - Subtle glow, no heavy blur
 * - Logarithmic frequency scale (better for human hearing)
 *
 * Performance:
 * - Single canvas element (no DOM manipulation)
 * - requestAnimationFrame for smooth 60fps
 * - Web Audio API AnalyserNode for real frequency data
 * - Automatic AudioContext cleanup
 */
export function PremiumAudioVisualizer({
  audioStream,
  frequencyData: externalFrequencyData,
  isRecording,
  isPaused = false,
  activeColor,
  idleColor,
  className = "",
}: PremiumAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousBarsRef = useRef<number[]>(Array(32).fill(0.2));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution (2x for Retina displays)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Design system colors (from DESIGN_GUIDELINES.md)
    const colors = {
      active: activeColor || getComputedStyle(document.documentElement)
        .getPropertyValue("--hw-primary")
        .trim() || "#203954", // Deep slate blue
      idle: idleColor || getComputedStyle(document.documentElement)
        .getPropertyValue("--hw-text-muted")
        .trim() || "#8A8378", // Muted text color
    };

    // Visualizer configuration (Apple/Notion minimalist style)
    const config = {
      barCount: 32,
      barWidth: 3,
      barGap: 6,
      minHeight: 0.15, // Minimum bar height (15% of container)
      maxHeight: 0.90, // Maximum bar height (90% of container)
      smoothing: 0.75, // Interpolation smoothing (0-1, higher = smoother)
      idleOpacity: 0.4,
      activeOpacity: 0.9,
    };

    const totalWidth = (config.barCount * config.barWidth) + ((config.barCount - 1) * config.barGap);
    const startX = (rect.width - totalWidth) / 2; // Center align

    /**
     * Draw bars with smooth animations and subtle glow
     */
    const drawBars = (barHeights: number[]) => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Determine color and opacity based on state
      const isActive = isRecording && !isPaused;
      const currentColor = isActive ? colors.active : colors.idle;
      const opacity = isActive ? config.activeOpacity : config.idleOpacity;

      barHeights.forEach((height, i) => {
        const x = startX + (i * (config.barWidth + config.barGap));
        const barHeight = height * rect.height;
        const y = (rect.height - barHeight) / 2; // Center vertically

        // Subtle glow (minimalist, not heavy blur)
        if (isActive) {
          ctx.shadowColor = currentColor;
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw bar with rounded caps
        ctx.fillStyle = currentColor;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.roundRect(x, y, config.barWidth, barHeight, config.barWidth / 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    /**
     * Process external frequency data (from useAudioAnalyzer) into bar heights
     */
    const processFrequencyData = (data: number[]): number[] => {
      const barHeights: number[] = [];
      const binCount = data.length;

      for (let i = 0; i < config.barCount; i++) {
        // Logarithmic frequency distribution (better for music/voice)
        const percent = i / config.barCount;
        const startBin = Math.floor(Math.pow(percent, 1.5) * binCount);
        const endBin = Math.floor(Math.pow((i + 1) / config.barCount, 1.5) * binCount);
        const binsPerBar = Math.max(1, endBin - startBin);

        // Average frequency data for this bar
        let sum = 0;
        for (let j = startBin; j < endBin; j++) {
          sum += data[j];
        }
        const average = sum / binsPerBar;

        // Boost mid-range frequencies (voice range ~300Hz-3kHz)
        let normalized = average;
        if (i >= config.barCount * 0.2 && i <= config.barCount * 0.6) {
          normalized *= 1.2; // Boost by 20%
        }

        // Map to min-max range
        const height = config.minHeight + (normalized * (config.maxHeight - config.minHeight));
        barHeights.push(Math.max(config.minHeight, Math.min(config.maxHeight, height)));
      }

      return barHeights;
    };

    /**
     * Setup Web Audio API for real-time frequency analysis
     */
    const setupAudio = async () => {
      if (!audioStream || !isRecording) return;

      try {
        // Create AudioContext and AnalyserNode
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();

        // Configure analyser for optimal frequency resolution
        analyserRef.current.fftSize = 256; // 128 frequency bins
        analyserRef.current.smoothingTimeConstant = 0.8; // Smooth transitions

        // Connect microphone stream to analyser
        const source = audioContextRef.current.createMediaStreamSource(audioStream);
        source.connect(analyserRef.current);

        // Create data array for frequency data
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      } catch (error) {
        console.error("Error setting up audio analysis:", error);
      }
    };

    /**
     * Process frequency data into bar heights
     * Uses logarithmic scale for better human hearing range representation
     */
    const getBarHeights = (): number[] => {
      // Use external frequency data if provided (from useAudioAnalyzer)
      if (externalFrequencyData && externalFrequencyData.length > 0) {
        return processFrequencyData(externalFrequencyData);
      }

      // Otherwise use internal analyzer
      if (!analyserRef.current || !dataArrayRef.current) {
        // Return idle state when no audio data
        return Array(config.barCount).fill(config.minHeight);
      }

      // Get frequency data from analyser
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // Map frequency bins to bars (logarithmic scale)
      const barHeights: number[] = [];
      const binCount = dataArrayRef.current.length;

      for (let i = 0; i < config.barCount; i++) {
        // Logarithmic frequency distribution (better for music/voice)
        const percent = i / config.barCount;
        const startBin = Math.floor(Math.pow(percent, 1.5) * binCount);
        const endBin = Math.floor(Math.pow((i + 1) / config.barCount, 1.5) * binCount);
        const binsPerBar = Math.max(1, endBin - startBin);

        // Average frequency data for this bar
        let sum = 0;
        for (let j = startBin; j < endBin; j++) {
          sum += dataArrayRef.current[j];
        }
        const average = sum / binsPerBar;

        // Normalize to 0-1 range and apply scaling
        let normalized = average / 255;

        // Boost mid-range frequencies (voice range ~300Hz-3kHz)
        if (i >= config.barCount * 0.2 && i <= config.barCount * 0.6) {
          normalized *= 1.2; // Boost by 20%
        }

        // Map to min-max range
        const height = config.minHeight + (normalized * (config.maxHeight - config.minHeight));
        barHeights.push(Math.max(config.minHeight, Math.min(config.maxHeight, height)));
      }

      return barHeights;
    };

    /**
     * Smooth interpolation between previous and current bar heights
     * Prevents jittery animations
     */
    const smoothBars = (currentBars: number[]): number[] => {
      return currentBars.map((current, i) => {
        const previous = previousBarsRef.current[i];
        const smoothed = previous + (current - previous) * (1 - config.smoothing);
        return smoothed;
      });
    };

    /**
     * Animation loop (60fps with requestAnimationFrame)
     */
    const animate = () => {
      let barHeights: number[];

      if (isRecording && !isPaused && analyserRef.current) {
        // Get real frequency data
        const currentBars = getBarHeights();
        // Smooth interpolation
        barHeights = smoothBars(currentBars);
        previousBarsRef.current = barHeights;
      } else {
        // Idle state - gentle decay to minimum height
        barHeights = previousBarsRef.current.map(h => {
          const decay = h + (config.minHeight - h) * 0.1;
          return Math.max(config.minHeight, decay);
        });
        previousBarsRef.current = barHeights;
      }

      drawBars(barHeights);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start visualization
    if (isRecording && !isPaused && audioStream) {
      setupAudio();
    }

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream, externalFrequencyData, isRecording, isPaused, activeColor, idleColor]);

  return (
    <div className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-[60px] rounded-lg"
        style={{
          imageRendering: "auto",
        }}
        aria-label="Audio waveform visualization"
        role="img"
      />
    </div>
  );
}
