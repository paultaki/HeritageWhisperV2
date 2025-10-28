import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAudioAnalyzerOptions {
  fftSize?: number; // Power of 2 between 32-32768 (default: 256)
  smoothingTimeConstant?: number; // 0-1 (default: 0.8)
  minDecibels?: number; // Default: -100
  maxDecibels?: number; // Default: -30
}

/**
 * Hook for real-time audio analysis using Web Audio API.
 * 
 * Extracts frequency data from a MediaStream for visualization purposes.
 * Returns normalized amplitude values (0-1) for each frequency bin.
 * 
 * @example
 * const { frequencyData, averageAmplitude, connect, disconnect } = useAudioAnalyzer();
 * 
 * // Connect to MediaRecorder stream
 * connect(stream);
 * 
 * // Use frequencyData for waveform visualization
 * frequencyData.map((amplitude, i) => <rect height={amplitude * 100} />)
 */
export function useAudioAnalyzer(options: UseAudioAnalyzerOptions = {}) {
  const {
    fftSize = 256,
    smoothingTimeConstant = 0.75,
    minDecibels = -90,
    maxDecibels = -30,
  } = options;

  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const [averageAmplitude, setAverageAmplitude] = useState<number>(0);
  const [decibelLevel, setDecibelLevel] = useState<number>(-60);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const smoothedDbRef = useRef<number>(-60);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Connect analyzer to a MediaStream (from getUserMedia)
   */
  const connect = useCallback((stream: MediaStream) => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyzer node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      analyserRef.current = analyser;

      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsAnalyzing(true);

      // Start analysis loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const analyze = () => {
        if (!analyserRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        // Normalize to 0-1 range
        const normalized = Array.from(dataArray).map(value => value / 255);

        // Calculate average amplitude
        const avg = normalized.reduce((sum, val) => sum + val, 0) / normalized.length;

        // Calculate decibel level (approximation)
        const db = 20 * Math.log10(Math.max(avg, 0.001)) + 60; // Add offset to get reasonable range

        // Smooth the dB level with exponential moving average (prevents seizure-like jumping)
        const smoothingFactor = 0.3; // Lower = smoother (0.3 = takes ~3-4 frames to catch up)
        smoothedDbRef.current = smoothedDbRef.current + (db - smoothedDbRef.current) * smoothingFactor;

        setFrequencyData(normalized);
        setAverageAmplitude(avg);
        setDecibelLevel(Math.round(smoothedDbRef.current));

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (error) {
      console.error('[useAudioAnalyzer] Failed to connect:', error);
      setIsAnalyzing(false);
    }
  }, [fftSize, smoothingTimeConstant, minDecibels, maxDecibels]);

  /**
   * Disconnect analyzer and cleanup
   */
  const disconnect = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsAnalyzing(false);
    setFrequencyData([]);
    setAverageAmplitude(0);
    setDecibelLevel(-60);
    smoothedDbRef.current = -60;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    frequencyData,
    averageAmplitude,
    decibelLevel,
    isAnalyzing,
    connect,
    disconnect,
  };
}
