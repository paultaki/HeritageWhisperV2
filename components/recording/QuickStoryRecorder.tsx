"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Square, RotateCcw, X, Loader2 } from "lucide-react";
import { useQuickRecorder } from "@/hooks/use-quick-recorder";
import { motion, AnimatePresence } from "framer-motion";

interface QuickStoryRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Quick Story Recorder Component
 *
 * Simple 2-5 minute recording interface with:
 * - 3-2-1 countdown before recording
 * - Pause/resume controls
 * - Visual timer
 * - Automatic transcription and navigation to wizard
 */
export function QuickStoryRecorder({ isOpen, onClose }: QuickStoryRecorderProps) {
  const {
    state,
    duration,
    countdown,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    restartRecording,
    cancelRecording,
    maxDuration,
  } = useQuickRecorder({
    onComplete: onClose,
  });

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercent = (duration / maxDuration) * 100;

  const handleClose = () => {
    if (state === "recording" || state === "paused") {
      if (window.confirm("Stop recording and discard your progress?")) {
        cancelRecording();
        onClose();
      }
    } else {
      cancelRecording();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-full transition"
            disabled={state === "processing"}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <AnimatePresence mode="wait">
            {/* Ready State */}
            {state === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center">
                  <Mic className="w-12 h-12 text-amber-700" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Ready to Record</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You'll have up to 5 minutes to record your story. You can pause and
                  resume anytime.
                </p>
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-12 py-6 text-lg rounded-full shadow-lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              </motion.div>
            )}

            {/* Countdown State */}
            {state === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="text-center py-16"
              >
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-9xl font-bold text-amber-500 mb-4"
                >
                  {countdown}
                </motion.div>
                <p className="text-gray-600 text-lg">Get ready...</p>
              </motion.div>
            )}

            {/* Recording & Paused State */}
            {(state === "recording" || state === "paused") && (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8"
              >
                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {state === "recording" && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-3 h-3 rounded-full bg-red-500"
                      />
                      <span className="text-red-600 font-semibold">Recording</span>
                    </>
                  )}
                  {state === "paused" && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-yellow-600 font-semibold">Paused</span>
                    </>
                  )}
                </div>

                {/* Timer display */}
                <div className="text-center mb-8">
                  <div className="text-6xl font-mono font-bold text-gray-800 mb-2">
                    {formatDuration(duration)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDuration(maxDuration - duration)} remaining
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Waveform placeholder */}
                <div className="flex items-center justify-center gap-1 h-24 mb-8">
                  {state === "recording" &&
                    Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-amber-500 rounded-full"
                        animate={{
                          height: [
                            `${Math.random() * 60 + 20}%`,
                            `${Math.random() * 60 + 20}%`,
                          ],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5,
                          delay: i * 0.02,
                        }}
                      />
                    ))}
                  {state === "paused" &&
                    Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-8 bg-gray-300 rounded-full"
                      />
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  {state === "recording" && (
                    <>
                      <Button
                        onClick={pauseRecording}
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8"
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </Button>
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 rounded-full px-8"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                  {state === "paused" && (
                    <>
                      <Button
                        onClick={resumeRecording}
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 rounded-full px-8"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </Button>
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Stop
                      </Button>
                      <Button
                        onClick={restartRecording}
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8"
                      >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Restart
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Processing State */}
            {state === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-amber-500" />
                <h2 className="text-2xl font-semibold mb-2">
                  Processing your recording...
                </h2>
                <p className="text-gray-600">
                  Transcribing audio and preparing your story for review
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
