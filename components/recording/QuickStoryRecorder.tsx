"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Square, RotateCcw, X, Loader2, PenTool } from "lucide-react";
import { useQuickRecorder } from "@/hooks/use-quick-recorder";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavCache } from "@/lib/navCache";

interface QuickStoryRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  promptQuestion?: string; // Optional prompt question from prompts page
}

/**
 * Quick Story Recorder Component
 *
 * Simple 2-5 minute recording interface with:
 * - 3-2-1 countdown before recording
 * - Pause/resume controls
 * - Visual timer
 * - Automatic transcription and navigation to wizard
 * - Optional prompt question display
 */
export function QuickStoryRecorder({ isOpen, onClose, promptQuestion }: QuickStoryRecorderProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'voice' | 'text'>('select');
  const [textStory, setTextStory] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);

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

  // Handle text story submission
  const handleTextSubmit = async () => {
    if (!textStory.trim()) return;

    setIsSavingText(true);

    // Save to NavCache for the wizard
    const cacheKey = NavCache.setData({
      recording: {
        mode: 'text',
        duration: 0,
        url: null,
        audioBlob: null,
      },
      transcription: {
        raw: textStory.trim(),
        formatted: textStory.trim(),
      },
      promptQuestion: promptQuestion || null,
    });

    // Navigate to wizard
    router.push(`/review/book-style?nav=${cacheKey}&mode=wizard`);
    onClose();
  };

  const handleClose = () => {
    if (state === "recording" || state === "paused") {
      if (window.confirm("Stop recording and discard your progress?")) {
        cancelRecording();
        setMode('select');
        setTextStory('');
        onClose();
      }
    } else if (mode === 'text' && textStory.trim()) {
      if (window.confirm("Discard your written story?")) {
        setMode('select');
        setTextStory('');
        onClose();
      }
    } else {
      cancelRecording();
      setMode('select');
      setTextStory('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Quick Story Recorder
        </DialogTitle>

        <div className="relative">
          <AnimatePresence mode="wait">
            {/* Mode Selection */}
            {mode === 'select' && state === "ready" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                {/* Display prompt question if provided */}
                {promptQuestion && (
                  <>
                    <h2 className="text-xl font-semibold mb-3">Your Question</h2>
                    <div className="bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 rounded-lg p-4 mb-6 max-w-xl mx-auto">
                      <p className="text-base text-gray-800 font-medium leading-relaxed">
                        {promptQuestion}
                      </p>
                    </div>
                  </>
                )}

                <h2 className="text-2xl font-semibold mb-3">How would you like to share your story?</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Choose to record with your voice or type your story
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => setMode('voice')}
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-8 py-6 text-base rounded-full shadow-lg"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Record with Voice
                  </Button>
                  <Button
                    onClick={() => setMode('text')}
                    size="lg"
                    variant="outline"
                    className="px-8 py-6 text-base rounded-full border-2"
                  >
                    <PenTool className="w-5 h-5 mr-2" />
                    Type Your Story
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Voice Recording Ready State */}
            {mode === 'voice' && state === "ready" && (
              <motion.div
                key="voice-ready"
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
                  You'll have up to 5 minutes to record. You can pause and resume anytime.
                </p>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setMode('select')}
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-12 py-6 text-lg rounded-full shadow-lg"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Text Input Mode */}
            {mode === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-6"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <PenTool className="w-10 h-10 text-blue-700" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Type Your Story</h2>
                  <p className="text-gray-600 text-sm">
                    Take your time to write your memory
                  </p>
                </div>

                <textarea
                  value={textStory}
                  onChange={(e) => setTextStory(e.target.value)}
                  placeholder={promptQuestion ? "Type your answer here..." : "Type your story here..."}
                  className="w-full h-64 p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-base"
                  autoFocus
                />

                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <span>{textStory.length} characters</span>
                  <span>{textStory.split(/\s+/).filter(w => w.length > 0).length} words</span>
                </div>

                <div className="flex gap-3 justify-center mt-6">
                  <Button
                    onClick={() => {
                      setMode('select');
                      setTextStory('');
                    }}
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleTextSubmit}
                    size="lg"
                    disabled={!textStory.trim() || isSavingText}
                    className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-12 rounded-full shadow-lg disabled:opacity-50"
                  >
                    {isSavingText ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                      </>
                    )}
                  </Button>
                </div>
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
                <div className="text-center mb-6 sm:mb-8">
                  <div className="text-5xl sm:text-6xl font-mono font-bold text-gray-800 mb-2">
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
                <div className="flex items-center justify-center gap-1 h-16 sm:h-24 mb-6 sm:mb-8">
                  {state === "recording" &&
                    Array.from({ length: 30 }).map((_, i) => (
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
                    Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-8 bg-gray-300 rounded-full"
                      />
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  {state === "recording" && (
                    <>
                      <Button
                        onClick={pauseRecording}
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 w-full sm:w-auto"
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </Button>
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 rounded-full px-8 w-full sm:w-auto"
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
                        className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 rounded-full px-8 w-full sm:w-auto"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </Button>
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 w-full sm:w-auto"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Stop
                      </Button>
                      <Button
                        onClick={restartRecording}
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 w-full sm:w-auto"
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
