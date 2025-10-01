"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceVisualizerProps {
  isRecording: boolean;
  mediaStream?: MediaStream;
  className?: string;
}

export function VoiceVisualizer({ isRecording, mediaStream, className = "" }: VoiceVisualizerProps) {
  const [volumes, setVolumes] = useState<number[]>([0, 0, 0, 0, 0]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && mediaStream) {
      // Create audio context and analyser with cross-browser support
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.5;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualization = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate volume for each circle
        const newVolumes = [0, 1, 2, 3, 4].map((index) => {
          const start = Math.floor((index / 5) * bufferLength);
          const end = Math.floor(((index + 1) / 5) * bufferLength);
          let sum = 0;
          for (let i = start; i < end; i++) {
            sum += dataArray[i];
          }
          return sum / (end - start) / 255;
        });
        
        setVolumes(newVolumes);
        animationFrameRef.current = requestAnimationFrame(updateVisualization);
      };

      updateVisualization();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.warn('AudioContext was already closed:', error);
        }
        audioContextRef.current = null;
      }
    };
  }, [isRecording, mediaStream]);

  useEffect(() => {
    if (!isRecording) {
      setVolumes([0, 0, 0, 0, 0]);
    }
  }, [isRecording]);

  return (
    <div className={`flex justify-center items-center space-x-3 ${className}`}>
      {volumes.map((volume, index) => {
        const size = [16, 24, 32, 24, 16][index];
        const scale = 1 + (volume * 0.5);
        const opacity = Math.max(0.3, volume);
        
        return (
          <div
            key={index}
            className="voice-circle transition-all duration-200"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              transform: `scale(${scale})`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
