"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RecordingScreenProps {
  prompt?: string;
  onFinish: (audioBlob: Blob, duration: number, prompt?: string) => void;
  onCancel: () => void;
}

export function RecordingScreen({
  prompt,
  onFinish,
  onCancel,
}: RecordingScreenProps) {
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "paused" | "stopped" | "error"
  >("idle");
  const [duration, setDuration] = useState(0); // in seconds
  const [error, setError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showStopWarning, setShowStopWarning] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_DURATION = 300; // 5 minutes in seconds

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder
      const options = { mimeType: "audio/webm" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstart = () => {
        setRecordingState("recording");
        startTimer();
      };

      recorder.onpause = () => {
        setRecordingState("paused");
        pauseTimer();
      };

      recorder.onresume = () => {
        setRecordingState("recording");
        resumeTimer();
      };

      recorder.onstop = () => {
        setRecordingState("stopped");
        pauseTimer();
      };

      recorder.start(250);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Failed to access microphone. Please check permissions.");
      setRecordingState("error");
      toast.error("Microphone access denied");
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const next = prev + 1;
        // Auto-stop at 5 minutes
        if (next >= MAX_DURATION) {
          handleStop();
        }
        return next;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resumeTimer = () => {
    startTimer();
  };

  const handlePauseResume = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recordingState === "recording") {
      recorder.pause();
    } else if (recordingState === "paused") {
      recorder.resume();
    }
  };

  const handleStop = () => {
    // Check minimum duration
    if (duration < 30) {
      setShowStopWarning(true);
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.stop();

    // Create blob and call onFinish
    setTimeout(() => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      onFinish(blob, duration, prompt);
      cleanup();
    }, 100);
  };

  const handleDiscard = () => {
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    cleanup();
    onCancel();
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const progressPercent = Math.min(100, (duration / MAX_DURATION) * 100);
  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const canStop = recordingState === "recording" || recordingState === "paused";

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={handleDiscard}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#2C5282]"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              Recording
            </h1>
          </div>

          <div className="w-[60px]"></div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 pb-10 pt-6">
        {/* Prompt display */}
        {prompt && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-[#2C5282] px-6 py-4 rounded-r-lg">
              <p className="text-[15px] leading-relaxed">{prompt}</p>
            </div>
            {isRecording && (
              <p className="text-sm text-gray-500 mt-2">
                Take your time • Pause whenever you need
              </p>
            )}
          </div>
        )}

        {/* Timer and progress */}
        <div className="flex flex-col items-center pt-8">
          {/* Large timer display */}
          <div className="text-5xl font-light tracking-wider text-gray-900 font-mono tabular-nums">
            {formatDuration(duration)}
          </div>
          <div className="mt-1 text-xs text-gray-400 uppercase">
            Recording Time
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm bg-gray-100 rounded-full h-1.5 mt-4">
            <div
              className="bg-[#2C5282] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Large pause/resume button */}
          <div className="mt-10">
            <div className="relative">
              <div className="relative w-48 h-48 rounded-full grid place-items-center transition-all bg-blue-50 ring-8 ring-blue-100">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-[#2C5282] animate-pulse opacity-30"></div>
                )}

                <button
                  onClick={handlePauseResume}
                  disabled={!(isRecording || isPaused)}
                  className="w-28 h-28 min-h-[80px] rounded-full grid place-items-center outline-none focus-visible:ring-4 focus-visible:ring-blue-300 transition-all text-white shadow-md active:scale-95 bg-[#2C5282] hover:brightness-110 disabled:opacity-50"
                  aria-label={
                    isRecording
                      ? "Pause"
                      : isPaused
                      ? "Resume"
                      : "Record"
                  }
                >
                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <Pause className="w-7 h-7" />
                      <span className="text-lg font-medium">Pause</span>
                    </div>
                  ) : isPaused ? (
                    <div className="flex items-center gap-2">
                      <Play className="w-7 h-7" />
                      <span className="text-lg font-medium">Resume</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mic className="w-7 h-7" />
                      <span className="text-lg font-medium">Record</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stop and Discard buttons */}
          <div className="mt-12 w-full grid grid-cols-2 gap-4">
            <button
              onClick={handleStop}
              disabled={!canStop}
              className="min-h-[64px] rounded-xl border border-gray-300 bg-transparent hover:bg-gray-50 active:bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition flex items-center justify-center gap-2 text-gray-600 disabled:opacity-50"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
            <button
              onClick={handleDiscard}
              className="min-h-[64px] rounded-xl border border-gray-300 bg-transparent hover:bg-gray-50 active:bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition flex items-center justify-center gap-2 text-gray-600"
            >
              <Trash2 className="w-5 h-5" />
              Discard
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-6 w-full text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Recording?</DialogTitle>
            <DialogDescription>
              This will delete your recording. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDiscardDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDiscard}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop warning dialog */}
      <Dialog open={showStopWarning} onOpenChange={setShowStopWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recording Too Short</DialogTitle>
            <DialogDescription>
              Your recording must be at least 30 seconds long. Continue
              recording or discard to start over.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowStopWarning(false)}>
              Continue Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
