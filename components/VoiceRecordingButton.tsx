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

      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          setCountdown(0);
          // Use setTimeout to avoid calling setState during render
          setTimeout(() => onStart(), 0);
        }
      }, 500); // 0.5s per count = 1.5s total
    }
  };

  // Voice level circular gradient fill
  const CircularGradientFill = () => {
    // Clamp voice level between 0 and 1
    const clampedLevel = Math.max(0, Math.min(1, voiceLevel));
    const fillPercentage = clampedLevel * 100;

    return (
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{
            background: 'linear-gradient(to top, rgba(251, 146, 60, 0.8) 0%, rgba(251, 146, 60, 0.2) 100%)',
            height: `${fillPercentage}%`,
          }}
          transition={{
            duration: 0.15,
            ease: "easeOut"
          }}
        />
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
            {/* Circular gradient fill in background */}
            {!isPaused && <CircularGradientFill />}

            {/* Timer overlay with enhanced visibility - perfectly centered */}
            <div className="absolute inset-0 flex items-center justify-center relative z-10">
              <div className="flex flex-col items-center justify-center">
                <motion.span
                  className="text-2xl font-bold text-white leading-none"
                  style={{ 
                    textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 2px rgba(255,255,255,0.3)',
                  }}
                  animate={{ opacity: isPaused ? 0.5 : 1 }}
                >
                  {formatTime(recordingTime)}
                </motion.span>
                {isPaused && (
                  <motion.span 
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-white/90 mt-0.5 font-medium leading-none"
                    style={{ 
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    Paused
                  </motion.span>
                )}
              </div>
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

