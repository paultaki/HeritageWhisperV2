"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioRecorder, AudioRecorderHandle } from "@/components/AudioRecorder";
import { WaveformVisualizer } from "@/components/recording/WaveformVisualizer";
import { useAudioAnalyzer } from "@/hooks/use-audio-analyzer";
import { useRecordingState as useGlobalRecordingState } from "@/contexts/RecordingContext";
import { cn } from "@/lib/utils";

interface RecordingOverlayProps {
  isOpen: boolean;
  onClose: () => void; // Intentional close (discard)
  onContinue: (audioBlob: Blob, duration: number) => void;
  existingAudioUrl?: string; // For re-recording
}

export function RecordingOverlay({
  isOpen,
  onClose,
  onContinue,
  existingAudioUrl,
}: RecordingOverlayProps) {
  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Global recording state for navigation
  const globalRecording = useGlobalRecordingState();

  // Audio analyzer for waveform visualization
  const { frequencyData, decibelLevel, connect, disconnect } = useAudioAnalyzer({
    fftSize: 128,
    smoothingTimeConstant: 0.75,
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopRecording = useCallback(() => {
    disconnect(); // Disconnect audio analyzer
    const blob = audioRecorderRef.current?.getCurrentRecording();
    const duration = audioRecorderRef.current?.getRecordingDuration() || 0;

    if (blob && blob.size > 0) {
      setAudioBlob(blob);
      setAudioDuration(duration);
      setAudioUrl(URL.createObjectURL(blob));
      setHasRecording(true);
      setIsRecording(false);
      setIsPaused(false);

      // Update global recording state
      globalRecording.stopRecording();
    }
  }, [disconnect, globalRecording]);

  // Recording timer with 2-minute max
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at 2 minutes (120 seconds)
          if (newTime >= 120) {
            handleStopRecording();
            return 120;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused, handleStopRecording]);

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Clean up when closing
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      disconnect();

      // Reset all recording state
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      setHasRecording(false);
      setAudioBlob(null);
      setAudioDuration(0);
      setAudioUrl(null);
      setCountdown(null);
      setShowConfirmDialog(false);
    }
  }, [isOpen, audioUrl, disconnect]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      disconnect();
    };
  }, [audioUrl, disconnect]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      connect(stream); // Connect to audio analyzer

      // Show 3-2-1 countdown
      setCountdown(3);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown(2);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown(1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown(null);

      // Set recording state immediately for instant UI feedback
      setIsRecording(true);
      setIsPaused(false);
      setHasRecording(false);
      setRecordingTime(0);

      // Update global recording state
      globalRecording.startRecording('quick-story');

      // Start recording after countdown
      await audioRecorderRef.current?.startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setCountdown(null);
      setIsRecording(false);
    }
  };

  const handleReRecord = async () => {
    // Clean up existing recording
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    // Clean up audio recorder
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }
    
    // Reset all state
    setAudioBlob(null);
    setAudioUrl(null);
    setHasRecording(false);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setCountdown(null);
    
    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Start new recording
    await handleStartRecording();
  };

  const handleContinue = () => {
    if (audioBlob && audioDuration > 0) {
      // Update global recording state before continuing
      globalRecording.stopRecording();
      onContinue(audioBlob, audioDuration);
      // Cleanup happens in parent
    }
  };

  const handleClose = () => {
    if (isRecording || hasRecording) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }
    disconnect();

    // Update global recording state
    globalRecording.stopRecording();

    setAudioBlob(null);
    setAudioUrl(null);
    setHasRecording(false);
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setShowConfirmDialog(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Overlay Card */}
      <div className="fixed inset-x-4 md:inset-x-0 md:left-1/2 md:-translate-x-1/2 top-[5%] md:top-[10%] z-50 md:mx-auto max-w-2xl">
        <div
          className={cn(
            "relative rounded-3xl border border-[#E8DDD3]",
            "bg-gradient-to-b from-[#FAF8F6]/95 to-[#F5EDE4]/95",
            "backdrop-blur-xl shadow-2xl",
            "min-h-[70vh] md:h-[75vh] flex flex-col",
            "overflow-hidden"
          )}
        >
          {/* Header - Mobile: X in top right, centered title below */}
          <div className="relative p-4 md:p-6 border-b border-[#E8DDD3]/50">
            {/* Close button - top right on mobile */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[#8B7355] hover:text-[#4A3428] transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Centered title */}
            <h2 className="text-2xl font-serif text-[#4A3428] text-center pr-8 md:pr-0">
              {existingAudioUrl ? "Re-record Your Memory" : "Record Your Memory"}
            </h2>
          </div>

          {/* Recording Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
            {/* Hidden AudioRecorder for actual recording logic */}
            <div className="hidden">
              <AudioRecorder
                ref={audioRecorderRef}
                onRecordingComplete={(blob, duration) => {
                  disconnect();
                  setAudioBlob(blob);
                  setAudioDuration(duration);
                  setAudioUrl(URL.createObjectURL(blob));
                  setHasRecording(true);
                  setIsRecording(false);
                }}
                maxDuration={120} // 2 minutes
                className="w-full"
                onStart={() => setIsRecording(true)}
                onStop={() => handleStopRecording()}
                onPause={() => setIsPaused(true)}
                onResume={() => setIsPaused(false)}
              />
            </div>

            {/* Waveform Visualizer - Always visible */}
            {!hasRecording && (
              <div className="w-full max-w-md px-4">
                <WaveformVisualizer
                  frequencyData={frequencyData}
                  isRecording={isRecording}
                  isPaused={isPaused}
                  decibelLevel={decibelLevel}
                />
              </div>
            )}

            {/* Countdown or Timer - Centered */}
            <div className="text-4xl md:text-5xl font-mono text-[#4A3428] font-semibold text-center">
              {countdown !== null ? (
                <span className="text-6xl md:text-7xl animate-pulse">{countdown}</span>
              ) : (
                formatTime(recordingTime)
              )}
            </div>

            {/* Max time indicator */}
            {isRecording && (
              <p className="text-sm text-[#8B7355] text-center">
                Maximum: 2:00
              </p>
            )}

            {/* Audio Playback (when stopped) */}
            {hasRecording && audioUrl && (
              <div className="w-full max-w-md px-4">
                <audio src={audioUrl} controls className="w-full" />
              </div>
            )}

            {/* Recording Instructions or Status - Centered */}
            {isRecording && !countdown ? (
              <div className="flex items-center gap-2 text-[#4A3428] text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <p className="text-lg font-medium">Recording</p>
              </div>
            ) : !isRecording && !hasRecording && !countdown ? (
              <p className="text-[#8B7355] text-center max-w-md px-4">
                Press the record button to start capturing your memory. Take your time
                and speak naturally.
              </p>
            ) : null}
          </div>

          {/* Action Buttons - Fixed at bottom, safe area aware */}
          <div className="p-4 md:p-6 border-t border-[#E8DDD3]/50 space-y-3 pb-safe">
            {hasRecording ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleReRecord}
                  variant="outline"
                  className="flex-1 border-[#E8DDD3] text-[#8B7355] hover:bg-[#FAF8F6]"
                >
                  Re-record
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                >
                  Continue
                </Button>
              </div>
            ) : isRecording ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-[#E8DDD3] text-[#8B7355] hover:bg-[#FAF8F6]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  className="flex-1"
                >
                  Stop Recording
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-[#E8DDD3] text-[#8B7355] hover:bg-[#FAF8F6]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartRecording}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                >
                  Start Recording
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Discard Dialog */}
      {showConfirmDialog && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" />
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-semibold text-[#4A3428] mb-2 text-center">
                Discard recording?
              </h3>
              <p className="text-[#8B7355] mb-6 text-center">
                Your recording will be lost. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDiscard}
                  variant="destructive"
                  className="flex-1"
                >
                  Discard
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
