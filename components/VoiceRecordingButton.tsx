"use client";

import { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioRecorderHandle } from "./AudioRecorder";
import designSystem from "@/lib/designSystem";

interface VoiceRecordingButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  onStart: () => void;
  audioRecorderRef: React.RefObject<AudioRecorderHandle>;
}

export function VoiceRecordingButton({
  isRecording,
  isPaused,
  recordingTime,
  onStart,
  audioRecorderRef,
}: VoiceRecordingButtonProps) {
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize audio analysis for voice visualization
  useEffect(() => {
    if (isRecording && !isPaused && !audioContextRef.current) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);

          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          microphone.connect(analyser);

          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          // Start analyzing voice levels
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const normalized = Math.min(average / 128, 1); // Normalize to 0-1
            setVoiceLevel(normalized);

            animationFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        })
        .catch((err) => {
          console.error("Error accessing microphone for visualization:", err);
        });
    }

    // Cleanup on pause or stop
    if ((!isRecording || isPaused) && audioContextRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      setVoiceLevel(0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Handle button click (start recording with countdown)
  const handleClick = () => {
    if (!isRecording) {
      // Show countdown before starting
      setShowCountdown(true);
      setCountdown(3);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowCountdown(false);
            onStart(); // Start recording
            return 0;
          }
          return prev - 1;
        });
      }, 500); // 0.5s per count = 1.5s total
    }
  };

  // Voice level visualization bars
  const VoiceVisualizer = () => {
    const bars = 5;
    const activeBarCount = Math.ceil(voiceLevel * bars);

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex gap-1 items-end h-12">
          {Array.from({ length: bars }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full"
              style={{
                background:
                  i < activeBarCount
                    ? designSystem.colors.gradients.coral
                    : "#e5e7eb",
                height: `${((i + 1) / bars) * 100}%`,
              }}
              animate={{
                opacity: i < activeBarCount ? 1 : 0.3,
                scaleY: i < activeBarCount ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                repeat: i < activeBarCount ? Infinity : 0,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRecording}
      className="relative w-32 h-32 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 disabled:cursor-default disabled:hover:scale-100"
      style={{
        background: isRecording
          ? isPaused
            ? "linear-gradient(to bottom, #6b7280, #4b5563)"
            : designSystem.colors.gradients.coral
          : designSystem.colors.gradients.coral,
        boxShadow: isRecording
          ? "0 8px 20px rgba(251, 146, 60, 0.4)"
          : "0 6px 16px rgba(251, 146, 60, 0.3)",
      }}
    >
      <AnimatePresence mode="wait">
        {showCountdown ? (
          // Countdown overlay
          <motion.div
            key="countdown"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-5xl font-bold text-white">{countdown}</span>
          </motion.div>
        ) : isRecording ? (
          // Recording state: Show timer + voice visualizer
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Voice visualizer in background */}
            {!isPaused && <VoiceVisualizer />}

            {/* Timer overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-2xl font-bold text-white"
                animate={{ opacity: isPaused ? 0.5 : 1 }}
              >
                {formatTime(recordingTime)}
              </motion.span>
              {isPaused && (
                <span className="text-xs text-white/80 mt-1">Paused</span>
              )}
            </div>
          </motion.div>
        ) : (
          // Initial state: Show mic + "Start"
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          >
            <Mic className="w-10 h-10 text-white" />
            <span className="text-sm font-semibold text-white">Start</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing ring when recording */}
      {isRecording && !isPaused && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-white/30"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </button>
  );
}

