"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Pause, Play, Square, Mic, Loader2, Upload } from "lucide-react";
import { type AudioRecordingScreenProps, type RecordingState } from "../types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import "../recording.css";

/**
 * AudioRecordingScreen - Core recording experience
 * Matches heritage-whisper-recorder reference design exactly
 */
export function AudioRecordingScreen({
  draft,
  onChange,
  onBack,
  onFinishAndReview,
  onSaveForLater,
  onSwitchToText,
  onCancel,
  isOverlayMode = false,
}: AudioRecordingScreenProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image dimensions for portrait detection
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const MAX_DURATION_SECONDS = 1800; // 30 minutes

  useEffect(() => {
    return cleanup;
  }, []);

  // Measure image dimensions when photo URL changes
  useEffect(() => {
    if (draft.photoUrl) {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = draft.photoUrl;
    } else {
      setImageDimensions(null);
    }
  }, [draft.photoUrl]);

  // Always use contain to show full image - blur fills any empty space
  // This works for both portrait AND wide landscape images

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setRecordingState("recording");
      startTimer();

      // Set up audio visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8; // Smooth out the jitter
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      updateAudioLevel();
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const startTimer = () => {
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const newTime = prev + 1;
        if (newTime >= MAX_DURATION_SECONDS) {
          handleStop();
        }
        return newTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // We want 20 bars total for the mirrored effect (10 per side)
    // We'll calculate 10 distinct levels from the frequency data
    const levelsCount = 10;

    // Skip the first few bins to avoid DC offset/hum (index 0-2 usually)
    const startIndex = 2;
    // We focus on the lower-mid range where voice energy sits (up to ~index 60 out of 128)
    const effectiveBufferLength = 60;
    const step = Math.floor((effectiveBufferLength - startIndex) / levelsCount);

    const calculatedLevels = [];

    for (let i = 0; i < levelsCount; i++) {
      const start = startIndex + (i * step);
      const end = start + step;
      let sum = 0;
      let count = 0;

      for (let j = start; j < end && j < bufferLength; j++) {
        sum += dataArray[j];
        count++;
      }

      const average = count > 0 ? sum / count : 0;
      // Normalize to 0-1 range with some boost
      const normalized = Math.min(1, (average / 255) * 1.2);
      calculatedLevels.push(normalized);
    }

    // Create mirrored pattern: [0, 1, 2, ... 9, 9, ... 2, 1, 0]
    // But we want the center to be the highest energy (low freqs)
    // So if calculatedLevels[0] is low freq (high energy), we want it in the center.
    // Let's arrange as: [9, 8, ... 0, 0, ... 8, 9] where 0 is low freq.

    const mirrored = [
      ...[...calculatedLevels].reverse(),
      ...calculatedLevels
    ];

    setAudioLevels(mirrored);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const handlePauseResume = () => {
    if (recordingState === "recording") {
      mediaRecorderRef.current?.pause();
      stopTimer();
      setRecordingState("paused");
    } else if (recordingState === "paused") {
      mediaRecorderRef.current?.resume();
      startTimer();
      setRecordingState("recording");
    }
  };

  const handleStop = async () => {
    if (!mediaRecorderRef.current) return;

    setRecordingState("processing");
    setIsProcessing(true);
    stopTimer();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    mediaRecorderRef.current.stop();

    await new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => resolve();
      }
    });

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

    // Call transcription API
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        const completeDraft = {
          ...draft,
          title: data.title || draft.title || "Untitled Story",
          audioBlob,
          durationSeconds: elapsedSeconds,
          recordingMode: (draft.photoUrl ? "photo_audio" : "audio") as "photo_audio" | "audio",
          transcription: data.transcription,
          lessonOptions: data.lessonOptions,
        };

        onFinishAndReview(completeDraft as any);
      } else {
        // If transcription fails, continue without it
        console.error("Transcription failed:", await response.text());
        const completeDraft = {
          ...draft,
          title: draft.title || "Untitled Story",
          audioBlob,
          durationSeconds: elapsedSeconds,
          recordingMode: (draft.photoUrl ? "photo_audio" : "audio") as "photo_audio" | "audio",
        };
        onFinishAndReview(completeDraft as any);
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      // Continue without transcription on error
      const completeDraft = {
        ...draft,
        title: draft.title || "Untitled Story",
        audioBlob,
        durationSeconds: elapsedSeconds,
        recordingMode: (draft.photoUrl ? "photo_audio" : "audio") as "photo_audio" | "audio",
      };
      onFinishAndReview(completeDraft as any);
    } finally {
      setIsProcessing(false);
      cleanup();
    }
  };

  const handleSaveForLater = () => {
    if (onSaveForLater) {
      const draftToSave = {
        ...draft,
        durationSeconds: elapsedSeconds,
      };
      onSaveForLater(draftToSave);
    }
    cleanup();
  };

  // Handle audio file upload
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/x-m4a'];
    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      alert('Please upload a valid audio file (MP3, WAV, M4A, OGG, or WebM)');
      return;
    }

    // Check size (25MB max for OpenAI Whisper)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`Audio file is too large. Maximum size is 25MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setRecordingState("processing");
    setIsProcessing(true);

    try {
      // Get audio duration using Audio element
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);

      const duration = await new Promise<number>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(Math.round(audio.duration));
        });
        audio.addEventListener('error', () => {
          resolve(0); // Default to 0 if we can't get duration
        });
      });

      URL.revokeObjectURL(audioUrl);

      // Create FormData and send to transcribe API
      const formData = new FormData();
      formData.append("audio", file, file.name);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        const completeDraft = {
          ...draft,
          title: data.title || draft.title || "Untitled Story",
          audioBlob: file,
          durationSeconds: duration || data.duration,
          recordingMode: (draft.photoUrl ? "photo_audio" : "audio") as "photo_audio" | "audio",
          transcription: data.transcription,
          lessonOptions: data.lessonOptions,
        };

        onFinishAndReview(completeDraft as any);
      } else {
        const errorData = await response.text();
        console.error("Transcription failed:", errorData);
        alert("Failed to process audio file. Please try again.");
        setRecordingState("idle");
      }
    } catch (error) {
      console.error("Error processing uploaded audio:", error);
      alert("Error processing audio file. Please try again.");
      setRecordingState("idle");
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const cleanup = () => {
    stopTimer();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    // Only close AudioContext if it exists and is not already closed
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;

    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isIdle = recordingState === "idle";

  // Waveform visualization
  const waveformBars = isIdle
    ? new Array(20).fill(0.1)
    : audioLevels;

  return (
    <div style={{ backgroundColor: "#F5F1ED", minHeight: isOverlayMode ? "auto" : "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        <div className="flex items-center gap-3">
          {isOverlayMode ? (
            <h2 className="text-xl font-serif font-semibold" style={{ color: "#2C3E50" }}>
              Record Your Memory
            </h2>
          ) : (
            <img
              src="/final logo/logo hw.svg"
              alt="Heritage Whisper"
              className="w-12 h-12"
            />
          )}
        </div>
        {!isProcessing && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="text-base font-medium transition-colors hover:opacity-70"
            style={{ color: "#6B7280", marginRight: isOverlayMode ? "0" : "-125px" }}
            aria-label="Cancel"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Hero Text - hidden in overlay mode since header has title */}
      {!isOverlayMode && (
        <div className="px-6 mb-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            className="font-serif font-semibold text-center"
            style={{
              fontSize: "32px",
              lineHeight: "1.2",
              color: "#2C3E50"
            }}
          >
            Record your story
          </h2>
        </div>
      )}

      {/* Photo Preview */}
      {draft.photoUrl && (
        <div className="mx-6 mb-6 relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", maxWidth: "600px", margin: "0 auto 1.5rem auto", backgroundColor: "#faf8f5" }}>
          {/* Blurred background layer - fills empty space for portrait images */}
          <img
            src={draft.photoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70 z-0"
          />
          {/* Foreground image with transform */}
          <img
            src={draft.photoUrl}
            alt="Story"
            className="absolute inset-0 w-full h-full z-10"
            style={{
              transform: draft.photoTransform
                ? `scale(${draft.photoTransform.zoom}) translate(${draft.photoTransform.position.x}%, ${draft.photoTransform.position.y}%)`
                : undefined,
              transformOrigin: 'center center',
              objectFit: 'contain',
              objectPosition: 'center center'
            }}
          />
          <div className="absolute top-4 left-4 z-20">
            <button className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit photo
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 px-6" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Timer Card */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isIdle ? "#9CA3AF" : "#10B981" }} />
              <span className="text-sm font-medium" style={{ color: "#6B7280" }}>
                {isIdle ? "Ready to record" : isRecording ? "Recording" : "Paused"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#9CA3AF" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
              </svg>
              Max 30m
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="text-5xl font-semibold tabular-nums" style={{ color: "#2C3E50" }}>
              {formatTime(elapsedSeconds)}
            </div>
            {!isIdle && (
              <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                {MAX_DURATION_SECONDS - elapsedSeconds}s remaining
              </p>
            )}
          </div>
        </div>

        {/* Waveform Card */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-center gap-1 h-12">
            {waveformBars.map((height, index) => (
              <div
                key={index}
                className={`w-1.5 rounded-full ${isProcessing ? "processing-wave-bar" : ""}`}
                style={{
                  height: isProcessing ? "24px" : `${Math.max(4, height * 48)}px`,
                  backgroundColor: isProcessing ? "#6B7280" : isIdle ? "#D1D5DB" : "#10B981",
                  opacity: isIdle && !isProcessing ? 0.5 : 1,
                  // Remove transition for instant response to the smoothed data
                  transition: isIdle && !isProcessing ? "all 0.3s ease" : "none",
                  animationDelay: isProcessing ? `${index * 0.05}s` : undefined
                }}
              />
            ))}
          </div>
          <p className="text-center text-xs mt-2 font-medium tracking-wide" style={{ color: "#9CA3AF" }}>
            {isProcessing ? "PROCESSING" : isIdle ? "READY TO RECORD" : isRecording ? "RECORDING" : "PAUSED"}
          </p>
        </div>

        {/* Controls */}
        {isIdle ? (
          <>
            <button
              onClick={startRecording}
              className="w-full py-4 rounded-xl font-medium text-base text-white flex items-center justify-center gap-2 mb-6"
              style={{ backgroundColor: "#2C3E50" }}
            >
              <Mic className="w-5 h-5" />
              Start recording
            </button>
          </>
        ) : (
          <div className="flex gap-3 mb-4">
            <button
              onClick={handlePauseResume}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl font-medium text-base text-white flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ backgroundColor: "#2C3E50" }}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={handleStop}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl font-medium text-base flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#2C3E50" }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#2C3E50" }} />
                  Processing...
                </>
              ) : (
                <>
                  <Square className="w-5 h-5" />
                  Finish
                </>
              )}
            </button>
          </div>
        )}

        {/* Text & Upload Options - hidden in overlay mode */}
        {isIdle && !isOverlayMode && (
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={onSwitchToText}
              className="text-base font-medium"
              style={{ color: "#2C3E50" }}
            >
              Prefer to type instead?
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-base font-medium flex items-center gap-2"
              style={{ color: "#2C3E50" }}
            >
              <Upload className="w-4 h-4" />
              Upload audio
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
              onChange={handleAudioUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Back Button - hidden in overlay mode */}
        {isIdle && !isOverlayMode && (
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl font-medium text-base flex items-center justify-center gap-2 mb-6"
            style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#2C3E50" }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Recording?"
        message="Are you sure you want to cancel? Your progress will be lost."
        confirmText="Yes, Cancel"
        cancelText="Keep Recording"
        onConfirm={() => {
          setShowCancelConfirm(false);
          onCancel();
        }}
        onCancel={() => setShowCancelConfirm(false)}
        variant="danger"
      />
    </div>
  );
}
