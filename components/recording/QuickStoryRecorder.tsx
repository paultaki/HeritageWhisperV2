"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AmbientSpotlight } from "@/components/ui/ambient-spotlight";
import { Mic, Pause, Play, Square, RotateCcw, X, Loader2, PenTool, Upload, Check } from "lucide-react";
import { useQuickRecorder } from "@/hooks/use-quick-recorder";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { navCache } from "@/lib/navCache";
import { useAuth } from "@/lib/auth";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { useAudioAnalyzer } from "@/hooks/use-audio-analyzer";
import { WaveformAudioPlayer } from "./WaveformAudioPlayer";

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
  const { toast } = useToast();
  const [mode, setMode] = useState<'select' | 'voice' | 'text'>('select');
  const [textStory, setTextStory] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [showDiscardRecordingConfirm, setShowDiscardRecordingConfirm] = useState(false);
  const [showDiscardTextConfirm, setShowDiscardTextConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showUploadError, setShowUploadError] = useState(false);
  const [isRecordButtonHovered, setIsRecordButtonHovered] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing messages that cycle through
  const processingMessages = [
    { text: "Listening to your story...", duration: 3000 },
    { text: "Preserving your words...", duration: 5000 },
    { text: "Finding the right question...", duration: 3000 },
    { text: "Almost ready...", duration: 0 }, // No duration, stays until complete
  ];

  // Audio analyzer for waveform visualization
  const { frequencyData, decibelLevel, connect, disconnect } = useAudioAnalyzer({
    fftSize: 128, // 64 frequency bins for 28 bars
    smoothingTimeConstant: 0.75,
  });

  const {
    state,
    duration,
    countdown,
    audioReviewUrl,
    transcriptionStatus,
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

  // Cycle through processing messages
  useEffect(() => {
    if (state === "processing") {
      setProcessingMessageIndex(0); // Reset to first message

      let currentIndex = 0;
      const timers: NodeJS.Timeout[] = [];

      const scheduleNextMessage = () => {
        const currentMessage = processingMessages[currentIndex];

        // If this message has a duration (not the last one), schedule the next
        if (currentMessage.duration > 0 && currentIndex < processingMessages.length - 1) {
          const timer = setTimeout(() => {
            currentIndex++;
            setProcessingMessageIndex(currentIndex);
            scheduleNextMessage();
          }, currentMessage.duration);
          timers.push(timer);
        }
      };

      scheduleNextMessage();

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [state, processingMessages]);

  // Auto-navigate when transcription completes (for both <30s and >=30s recordings)
  useEffect(() => {
    if (state === "processing" && transcriptionStatus === "complete") {
      // Give a brief moment to show completion, then navigate
      const timer = setTimeout(() => {
        continueFromReview();
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }

    // Safety fallback: If stuck in processing for >15 seconds, retry
    if (state === "processing" && transcriptionStatus === "processing") {
      const fallbackTimer = setTimeout(() => {
        const existingResult = sessionStorage.getItem('hw_transcription_result');
        if (existingResult) {
          continueFromReview();
        }
      }, 15000);

      return () => clearTimeout(fallbackTimer);
    }
  }, [state, transcriptionStatus, continueFromReview]);

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

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Audio file must be less than 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
        variant: "destructive",
      });
      event.target.value = ''; // Reset input
      return;
    }

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
        if (response.status === 413) {
          throw new Error('Audio file is too large. Please use a file under 25MB or record directly instead.');
        }
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();

      // Extract transcription text (the API returns it as a string)
      const transcriptionText = data.transcription || data.text || '';

      // Get audio duration (try to calculate from file if not provided)
      let audioDuration = data.duration || 30;

      // Try to get actual duration from audio file
      try {
        const audioUrl = URL.createObjectURL(file);
        const audio = new Audio(audioUrl);
        await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            audioDuration = Math.round(audio.duration);
            URL.revokeObjectURL(audioUrl);
            resolve(null);
          });
        });
      } catch {
        // Could not get audio duration, using default
      }

      // Convert File to Blob for NavCache
      const audioBlob = new Blob([file], { type: file.type });

      // Save to NavCache for transcription-select screen (same as recording flow)
      const navId = navCache.generateId();
      await navCache.set(navId, {
        mode: "quick",
        rawTranscript: transcriptionText,
        enhancedTranscript: transcriptionText,
        duration: audioDuration,
        timestamp: new Date().toISOString(),
        audioBlob: audioBlob,
        lessonOptions: data.lessonOptions,
        formattedContent: data.formattedContent,
        useEnhanced: false,
      });

      // Navigate to transcription-select (same as recording flow)
      router.push(`/review/book-style?nav=${navId}&mode=transcription-select`);
      onClose();
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload audio file. Please try again or record directly.",
        variant: "destructive",
      });
      setShowUploadError(true);
    } finally {
      setIsUploadingAudio(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    if (state === "recording" || state === "paused") {
      setShowDiscardRecordingConfirm(true);
    } else if (state === "review") {
      // If reviewing audio, confirm before discarding
      setShowDiscardRecordingConfirm(true);
    } else if (mode === 'text' && textStory.trim()) {
      setShowDiscardTextConfirm(true);
    } else {
      cancelRecording();
      setMode('select');
      setTextStory('');
      onClose();
    }
  };

  const handleConfirmDiscardRecording = () => {
    setShowDiscardRecordingConfirm(false);
    cancelRecording();
    setMode('select');
    setTextStory('');
    onClose();
  };

  const handleConfirmDiscardText = () => {
    setShowDiscardTextConfirm(false);
    setMode('select');
    setTextStory('');
    onClose();
  };

  const handleRestartClick = () => {
    setShowRestartConfirm(true);
  };

  const handleConfirmRestart = () => {
    setShowRestartConfirm(false);
    restartRecording();
  };

  // Connect audio analyzer when recording starts
  useEffect(() => {
    if (state === "recording" && !audioReviewUrl) {
      // Get the microphone stream from getUserMedia
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        connect(stream);
      }).catch((err) => {
        console.error("[QuickStoryRecorder] Failed to connect audio analyzer:", err);
      });
    } else if (state !== "recording" && state !== "paused") {
      // Disconnect when not recording
      disconnect();
    }

    return () => {
      if (state !== "recording" && state !== "paused") {
        disconnect();
      }
    };
  }, [state, audioReviewUrl, connect, disconnect]);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Modal closed - reset everything for next time it opens
      // Disconnect audio analyzer
      disconnect();
      
      // Use timeout to ensure cleanup happens after modal animation
      const timeoutId = setTimeout(() => {
        cancelRecording();
        setMode('select');
        setTextStory('');
      }, 300); // Wait for dialog close animation
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, cancelRecording, disconnect]); // Run when modal closes

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-full sm:max-w-full p-0 gap-0"
        style={{
          margin: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: 'none',
          height: '100vh',
          width: '100vw',
          maxHeight: '100vh',
          borderRadius: 0
        }}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Quick Story Recorder
        </DialogTitle>
        <DialogDescription className="sr-only">
          Record or type your story. Choose between voice recording or text entry.
        </DialogDescription>

        {/* Logo - 3x larger */}
        <div className="flex justify-center" style={{ marginTop: '-50px', marginBottom: '-110px' }}>
          <Image
            src="/logo black.svg"
            alt="Heritage Whisper"
            width={960}
            height={240}
            className="h-60 w-auto"
            priority
          />
        </div>

        <div className="relative pb-24">
          <AnimatePresence mode="wait">
            {/* Mode Selection */}
            {mode === 'select' && state === "ready" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-4"
              >
                {/* Display prompt question if provided */}
                {promptQuestion && (
                  <>
                    <h2 className="text-xl font-semibold mb-3 text-center">Your Question</h2>
                    <div className="bg-gradient-to-br from-[#f5f0f5] to-[#f8f3f8] border-2 border-[#d4c4d4] rounded-lg p-4 mb-6 max-w-xl mx-auto">
                      <p className="text-base text-gray-800 font-medium leading-relaxed text-center">
                        {promptQuestion}
                      </p>
                    </div>
                  </>
                )}

                <h2 className="text-2xl font-semibold mb-16 text-center">Share Your Story</h2>

                {/* Hero Record Button */}
                <div className="flex flex-col items-center">
                  <div
                    className="relative mb-4"
                    onMouseEnter={() => setIsRecordButtonHovered(true)}
                    onMouseLeave={() => setIsRecordButtonHovered(false)}
                  >
                    <button
                      onClick={startRecording}
                      className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#8b6b7a]/30"
                      style={{
                        background: "linear-gradient(135deg, #8b6b7a 0%, #b88b94 100%)",
                        boxShadow: "0 8px 24px rgba(139, 107, 122, 0.5), inset 0 4px 8px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.25)",
                        border: "2px solid rgba(255, 255, 255, 0.4)",
                      }}
                    >
                      {/* Pulse animation ring - only on hover */}
                      {isRecordButtonHovered && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "linear-gradient(135deg, #8b6b7a 0%, #b88b94 100%)",
                          }}
                          animate={{
                            scale: [1, 1.25, 1.25],
                            opacity: [0.5, 0, 0],
                          }}
                          transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            repeatDelay: 0.65,
                          }}
                        />
                      )}

                      {/* Icon */}
                      <Image
                        src="/silver_mic_sm.png"
                        alt="Record"
                        width={32}
                        height={32}
                        className="z-10"
                      />
                    </button>
                  </div>

                  {/* Label below button - centered */}
                  <p className="text-center text-gray-600 font-medium mb-12 w-full">
                    Tap to Record
                  </p>

                  {/* Type option - subtle text link - centered */}
                  <button
                    onClick={() => setMode('text')}
                    className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 opacity-60 hover:opacity-100 transition-all mb-6 hover:underline decoration-dotted underline-offset-4 w-full"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>or type your story instead</span>
                  </button>

                  {/* Upload option - even more subtle - centered */}
                  <div className="flex justify-center w-full">
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
                      className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 opacity-50 hover:opacity-80 transition-all disabled:opacity-50 hover:underline decoration-dotted underline-offset-4"
                    >
                      {isUploadingAudio ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing audio...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>or upload an audio file</span>
                        </>
                      )}
                    </button>
                  </div>
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
                className="py-6 flex flex-col max-h-[70vh] sm:max-h-none"
              >
                <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <PenTool className="w-8 h-8 sm:w-10 sm:h-10 text-blue-700" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 text-center">Type Your Story</h2>
                  <p className="text-gray-600 text-sm text-center">
                    Take your time to write your memory
                  </p>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <textarea
                    value={textStory}
                    onChange={(e) => setTextStory(e.target.value)}
                    placeholder={promptQuestion ? "Type your answer here..." : "Type your story here..."}
                    className="w-full flex-1 min-h-[160px] sm:min-h-[200px] p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b6b7a] focus:border-transparent resize-none text-base"
                    autoFocus
                  />

                  <div className="flex items-center justify-between mt-3 sm:mt-4 text-sm text-gray-500 flex-shrink-0">
                    <span>{textStory.length} characters</span>
                    <span>{textStory.split(/\s+/).filter(w => w.length > 0).length} words</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-center mt-4 sm:mt-6 flex-shrink-0">
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
                    className="bg-gradient-to-r from-[#8b6b7a] to-[#b88b94] hover:from-[#7a5a69] hover:to-[#a77a83] text-white px-12 rounded-full shadow-lg disabled:opacity-50"
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
                className="flex flex-col items-center justify-center text-center py-16"
              >
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-9xl font-bold text-[#8b6b7a] mb-4"
                >
                  {countdown}
                </motion.div>
                <p className="text-gray-600 text-lg text-center">Get ready...</p>
              </motion.div>
            )}

            {/* Recording & Paused State */}
            {(state === "recording" || state === "paused") && (
              <AmbientSpotlight
                size={500}
                intensity={0.35}
                color="rgba(124, 101, 105, 0.12)"
                animationSpeed={12000}
                className="rounded-2xl"
              >
                <motion.div
                  key="recording"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6"
                >
                  {/* Whisper Capture title centered below logo */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-[#322B27]">
                      Whisper Capture
                    </h3>
                  </div>

                {/* Timer and status badges */}
                <div className="mb-6 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-md border border-[#E0D9D7] bg-[#EBE8E6] px-2.5 py-1.5 text-[13px] text-[#322B27] shadow-sm ring-1 ring-inset ring-[#E0D9D7]">
                    <span className="tabular-nums font-mono">{formatDuration(duration)}</span>
                  </div>
                  {state === "recording" && (
                    <div className="inline-flex items-center gap-2 rounded-md border border-[#7C6569] bg-[#7C6569] px-3 py-1.5 text-[13px] text-[#FAF8F6] shadow-sm ring-1 ring-inset ring-[#9C7280]/40">
                      <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
                        <motion.span
                          className="absolute inline-block h-2.5 w-2.5 rounded-full bg-[#FAF8F6] shadow-[0_0_0_1px_rgba(50,43,39,0.08)]"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                        <span className="absolute inline-block h-2.5 w-2.5 rounded-full bg-[#BFA9AB] blur-[2px]" />
                      </span>
                      Recording
                    </div>
                  )}
                  {state === "paused" && (
                    <div className="inline-flex items-center gap-2 rounded-md border border-[#99898C] bg-[#99898C] px-3 py-1.5 text-[13px] text-white shadow-sm">
                      Paused
                    </div>
                  )}
                </div>

                {/* Waveform Visualizer - Max width 490px on desktop */}
                <div className="mx-auto w-full max-w-[490px] mb-6">
                  <div className="rounded-xl border border-[#E0D9D7] bg-[#EBE8E6] p-4 shadow-sm ring-1 ring-inset ring-[#E0D9D7]">
                    <WaveformVisualizer
                      frequencyData={frequencyData}
                      isRecording={state === "recording"}
                      isPaused={state === "paused"}
                      decibelLevel={decibelLevel}
                    />

                  {/* Controls inside the card */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#E0D9D7] pt-3">
                    <div className="text-[13px] text-[#99898C]">
                      {(maxDuration - duration) <= 30
                        ? "30 seconds left to finish"
                        : `${formatDuration(maxDuration - duration)} remaining`}
                    </div>
                    <div className="flex items-center gap-2">
                      {state === "recording" && (
                        <>
                          <button
                            onClick={pauseRecording}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E0D9D7] bg-[#FAF8F6] w-[77px] py-2 text-[13px] text-[#322B27] shadow-sm ring-1 ring-inset ring-[#E0D9D7] transition hover:bg-[#EBE8E6] focus:outline-none focus:ring-2 focus:ring-[#9C7280]/50 active:scale-[0.99]"
                          >
                            <Pause className="h-4 w-4" />
                            Pause
                          </button>
                          <button
                            onClick={stopRecording}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E0D9D7] bg-[#FAF8F6] w-[77px] py-2 text-[13px] text-[#322B27] shadow-sm ring-1 ring-inset ring-[#E0D9D7] transition hover:bg-[#EBE8E6] focus:outline-none focus:ring-2 focus:ring-[#9C7280]/50 active:scale-[0.99]"
                          >
                            <Square className="h-4 w-4" />
                            Stop
                          </button>
                        </>
                      )}
                      {state === "paused" && (
                        <>
                          <button
                            onClick={resumeRecording}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#7C6569] bg-[#7C6569] w-[77px] py-2 text-[13px] text-[#FAF8F6] shadow-sm ring-1 ring-inset ring-[#9C7280]/40 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#9C7280]/60 active:scale-[0.99]"
                          >
                            <Play className="h-4 w-4" />
                            Resume
                          </button>
                          <button
                            onClick={stopRecording}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E0D9D7] bg-[#FAF8F6] w-[77px] py-2 text-[13px] text-[#322B27] shadow-sm ring-1 ring-inset ring-[#E0D9D7] transition hover:bg-[#EBE8E6] focus:outline-none focus:ring-2 focus:ring-[#9C7280]/50 active:scale-[0.99]"
                          >
                            <Square className="h-4 w-4" />
                            Stop
                          </button>
                          <button
                            onClick={handleRestartClick}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E0D9D7] bg-[#FAF8F6] w-[77px] py-2 text-[13px] text-[#322B27] shadow-sm ring-1 ring-inset ring-[#E0D9D7] transition hover:bg-[#EBE8E6] focus:outline-none focus:ring-2 focus:ring-[#9C7280]/50 active:scale-[0.99]"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restart
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  </div>
                </div>

                {/* Progress bar - Max width 490px on desktop */}
                <div className="mx-auto w-full max-w-[490px]">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#8b6b7a] to-[#b88b94]"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-center text-[#99898C]">
                  Tip: For best results, speak clearly and minimize background noise
                </p>
                </motion.div>
              </AmbientSpotlight>
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
                  <h2 className="text-2xl font-semibold mb-2 text-center">Review Your Recording</h2>
                  <p className="text-gray-600 text-center">
                    Listen to your recording before continuing
                  </p>
                </div>

                {/* Waveform Audio Player - Max width 490px on desktop */}
                <div className="mx-auto w-full max-w-[490px] mb-6">
                  <WaveformAudioPlayer
                    audioUrl={audioReviewUrl}
                    duration={duration}
                  />
                </div>

                {/* Transcription Status Card - Max width 490px on desktop */}
                {transcriptionStatus === 'processing' && (
                  <div className="mx-auto w-full max-w-[490px] mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-base font-semibold text-blue-900 mb-2">
                        Transcribing in the background...
                      </p>
                      <p className="text-sm text-blue-700">
                        Your transcription will be ready when you click "Continue"
                      </p>
                    </div>
                  </div>
                )}
                
                {transcriptionStatus === 'complete' && (
                  <div className="mx-auto w-full max-w-[490px] mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
                      <Check className="w-6 h-6 text-green-600 mx-auto mb-3" />
                      <p className="text-base font-semibold text-green-900 mb-2">
                        ✨ Transcription ready!
                      </p>
                      <p className="text-sm text-green-700">
                        Click "Continue" to review your transcription
                      </p>
                    </div>
                  </div>
                )}

                {transcriptionStatus === 'idle' && duration >= 30 && (
                  <div className="mx-auto w-full max-w-[490px] mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
                      <p className="text-base text-blue-900">
                        <strong>💡 Tip:</strong> Take your time reviewing - we'll transcribe your audio while you listen!
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Max width 490px on desktop */}
                <div className="mx-auto w-full max-w-[490px]">
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={continueFromReview}
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#8b6b7a] to-[#b88b94] hover:from-[#7a5a69] hover:to-[#a77a83] text-white py-6 text-lg rounded-full shadow-lg"
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
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-[#8b6b7a]" />
                <h2 className="text-2xl font-semibold mb-2 text-center">
                  Processing your recording...
                </h2>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={processingMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-600 text-center"
                  >
                    {processingMessages[processingMessageIndex].text}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Bar - Fixed */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#E0D9D7] px-6 py-4 flex items-center justify-between z-50"
          style={{
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sm text-[#7C6569] hover:text-[#5a4a4d] transition-colors font-medium"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          {/* Empty space on right for future additions */}
          <div className="w-20"></div>
        </div>
      </DialogContent>

      {/* Discard Recording Confirmation */}
      <ConfirmModal
        isOpen={showDiscardRecordingConfirm}
        title="Discard Recording?"
        message="Stop recording and discard your progress?"
        confirmText="Yes, Discard"
        cancelText="Keep Recording"
        onConfirm={handleConfirmDiscardRecording}
        onCancel={() => setShowDiscardRecordingConfirm(false)}
        variant="danger"
      />

      {/* Discard Text Confirmation */}
      <ConfirmModal
        isOpen={showDiscardTextConfirm}
        title="Discard Story?"
        message="Discard your written story?"
        confirmText="Yes, Discard"
        cancelText="Keep Writing"
        onConfirm={handleConfirmDiscardText}
        onCancel={() => setShowDiscardTextConfirm(false)}
        variant="danger"
      />

      {/* Restart Recording Confirmation */}
      <ConfirmModal
        isOpen={showRestartConfirm}
        title="Restart Recording?"
        message="This will discard your current recording. Are you sure you want to restart?"
        confirmText="Yes, Restart"
        cancelText="Keep Recording"
        onConfirm={handleConfirmRestart}
        onCancel={() => setShowRestartConfirm(false)}
        variant="danger"
      />

      {/* Upload Error */}
      <ConfirmModal
        isOpen={showUploadError}
        title="Upload Failed"
        message="Failed to process audio file. Please try again."
        confirmText="OK"
        onConfirm={() => setShowUploadError(false)}
        onCancel={() => setShowUploadError(false)}
        variant="primary"
      />
    </Dialog>
  );
}
