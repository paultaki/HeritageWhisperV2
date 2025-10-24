"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Square, RotateCcw, X, Loader2, PenTool, Upload } from "lucide-react";
import { useQuickRecorder } from "@/hooks/use-quick-recorder";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { navCache } from "@/lib/navCache";
import { useAuth } from "@/lib/auth";

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
  const { session } = useAuth();
  const [mode, setMode] = useState<'select' | 'voice' | 'text'>('select');
  const [textStory, setTextStory] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    duration,
    countdown,
    audioReviewUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    restartRecording,
    cancelRecording,
    continueFromReview,
    reRecordFromReview,
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
    const cacheKey = navCache.store({
      mode: 'quick',
      transcription: textStory.trim(),
      rawTranscript: textStory.trim(),
      duration: 0,
      prompt: promptQuestion ? {
        title: 'Your Question',
        text: promptQuestion,
      } : undefined,
    });

    // Navigate to wizard
    router.push(`/review/book-style?nav=${cacheKey}&mode=wizard`);
    onClose();
  };

  // Handle audio file upload
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);

    try {
      // Create FormData and upload to transcription endpoint
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/transcribe-assemblyai', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      console.log('[QuickStoryRecorder] Transcription response:', data);

      // Extract transcription text (the API returns it as a string)
      const transcriptionText = data.transcription || data.text || '';
      console.log('[QuickStoryRecorder] Extracted transcription:', transcriptionText);

      // Save to NavCache for the wizard
      const cacheKey = navCache.store({
        mode: 'quick',
        transcription: transcriptionText,
        rawTranscript: transcriptionText,
        enhancedTranscript: transcriptionText, // Add this for the wizard
        duration: data.duration || 30,
        audioBlob: file,
        prompt: promptQuestion ? {
          title: 'Your Question',
          text: promptQuestion,
        } : undefined,
      });

      // Navigate to wizard
      router.push(`/review/book-style?nav=${cacheKey}&mode=wizard`);
      onClose();
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to process audio file. Please try again.');
    } finally {
      setIsUploadingAudio(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        <DialogDescription className="sr-only">
          Record or type your story. Choose between voice recording or text entry.
        </DialogDescription>

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

                <div className="flex gap-3 justify-center px-4">
                  <Button
                    onClick={() => setMode('select')}
                    size="lg"
                    variant="outline"
                    className="rounded-full px-4 sm:px-6 flex-shrink"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-6 sm:px-12 py-6 text-base sm:text-lg rounded-full shadow-lg flex-shrink-0"
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

                {/* Subtle upload audio link */}
                <div className="text-center mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                    disabled={isUploadingAudio}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAudio}
                    className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
                  >
                    {isUploadingAudio ? (
                      <>
                        <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />
                        Processing audio...
                      </>
                    ) : (
                      <>
                        <Upload className="inline w-3 h-3 mr-1" />
                        or upload an audio file instead
                      </>
                    )}
                  </button>
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

            {/* Audio Review Screen */}
            {state === "review" && audioReviewUrl && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-8"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold mb-2">Review Your Recording</h2>
                  <p className="text-gray-600">
                    Listen to your recording before continuing
                  </p>
                </div>

                {/* Audio Player Card */}
                <div className="bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Your Story</p>
                        <p className="text-sm text-gray-600">{formatDuration(duration)}</p>
                      </div>
                    </div>
                  </div>

                  {/* HTML5 Audio Player */}
                  <audio
                    controls
                    src={audioReviewUrl}
                    className="w-full rounded-lg"
                    style={{
                      outline: "none",
                    }}
                  />

                  <p className="text-sm text-gray-600 text-center mt-4">
                    Listen carefully - you can re-record if needed
                  </p>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tip:</strong> While you're adding your title, date, and photos on the next screens, we'll be transcribing your audio in the background!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={continueFromReview}
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white py-6 text-lg rounded-full shadow-lg"
                  >
                    Continue to Add Details
                    <Play className="w-5 h-5 ml-2" />
                  </Button>

                  <Button
                    onClick={reRecordFromReview}
                    variant="outline"
                    size="lg"
                    className="w-full py-6 text-lg rounded-full"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Re-record
                  </Button>
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
