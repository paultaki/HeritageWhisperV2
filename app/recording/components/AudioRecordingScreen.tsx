"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Pause, Play, Square, Mic, Clock } from "lucide-react";
import { type AudioRecordingScreenProps, type RecordingState } from "../types";
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
}: AudioRecordingScreenProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const MAX_DURATION_SECONDS = 1800; // 30 minutes

  useEffect(() => {
    return cleanup;
  }, []);

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
      analyser.fftSize = 64; // Smaller FFT size for fewer bars but more responsive
      analyser.smoothingTimeConstant = 0.5; // Make it snappier
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

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume for the whole frame
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);

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
    setIsProcessing(true); // Show loading spinner
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
      cleanup();
      setIsProcessing(false);
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

  // Improved Waveform visualization
  // Create 20 bars that react to audio level with some randomness and symmetry
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    if (isIdle) return 0.15; // Low idle state

    // Calculate a "wave" effect that moves
    const waveOffset = Math.sin((Date.now() / 150) + (i * 0.5));

    // Base height driven by audio volume (amplified)
    const volumeHeight = Math.max(0.15, audioLevel * 2.5);

    // Combine volume with wave effect, but keep volume as primary driver
    // Center bars are taller
    const centerFactor = 1 - Math.abs(i - 10) / 10; // 0 at edges, 1 at center

    let height = volumeHeight * (0.5 + centerFactor * 0.5);

    // Add some jitter for liveliness
    height += (Math.random() * 0.1 * audioLevel);

    return Math.max(0.15, Math.min(1.0, height));
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F2EC]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img
            src="/final logo/logo-new.svg"
            alt="Heritage Whisper"
            className="h-10 w-auto"
          />
          <div className="leading-tight">
            <p className="text-sm m-0 text-[#8A8378] leading-tight">
              {draft.title || "Record your story"}
            </p>
          </div>
        </div>
        {onSaveForLater && !isProcessing && (
          <button
            onClick={handleSaveForLater}
            className="text-base font-medium text-[#6B7280] hover:text-[#203954] transition-colors"
          >
            Save later
          </button>
        )}
      </div>

      {/* Photo Preview */}
      {draft.photoUrl && (
        <div className="mx-6 mb-6 relative rounded-2xl overflow-hidden shadow-md max-w-2xl mx-auto w-full aspect-[16/10]">
          <img src={draft.photoUrl} alt="Story" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4">
            <button className="bg-black/60 hover:bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit photo
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 px-6 pb-12 max-w-2xl mx-auto w-full flex flex-col">
        {/* Timer Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-[#EFE6DA]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isIdle ? "bg-[#9CA3AF]" : "bg-[#10B981] animate-pulse"}`} />
              <span className="text-sm font-medium text-[#6B7280]">
                {isIdle ? "Ready to record" : isRecording ? "Recording" : isProcessing ? "Processing..." : "Paused"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <Clock className="w-4 h-4" />
              Max 30m
            </div>
          </div>

          <div className="text-center mb-2">
            <div className="text-6xl font-semibold tabular-nums text-[#203954] tracking-tight">
              {formatTime(elapsedSeconds)}
            </div>
            {!isIdle && (
              <p className="text-sm mt-2 text-[#9CA3AF]">
                {Math.floor((MAX_DURATION_SECONDS - elapsedSeconds) / 60)}m {(MAX_DURATION_SECONDS - elapsedSeconds) % 60}s remaining
              </p>
            )}
          </div>
        </div>

        {/* Waveform Card */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-[#EFE6DA]">
          <div className="flex items-center justify-center gap-1.5 h-24">
            {waveformBars.map((height, index) => (
              <div
                key={index}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: isIdle ? "#E5E7EB" : "#10B981",
                  opacity: isIdle ? 0.5 : 1
                }}
              />
            ))}
          </div>
          <p className="text-center text-sm mt-6 font-medium tracking-wider text-[#9CA3AF] uppercase">
            {isIdle ? "Tap microphone to start" : isRecording ? "Listening..." : isProcessing ? "Saving your story..." : "Paused"}
          </p>
        </div>

        {/* Tip */}
        <div className="mb-8 text-center">
          <p className="text-lg text-[#6B7280]">
            {isProcessing ? "Please wait while we save and transcribe your story." : "Take your time. You can pause anytime and edit later."}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-auto">
          {isProcessing ? (
            <div className="w-full py-6 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-4 border-[#203954] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#203954] font-medium">Finishing up...</p>
            </div>
          ) : isIdle ? (
            <>
              <button
                onClick={startRecording}
                className="w-full py-5 rounded-2xl font-medium text-lg text-white flex items-center justify-center gap-3 mb-4 shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 transition-all active:scale-[0.99]"
                style={{ backgroundColor: "#203954" }}
              >
                <div className="p-1 bg-white/20 rounded-full">
                  <Mic className="w-6 h-6" />
                </div>
                Start recording
              </button>
              <p className="text-base text-center mb-8 text-[#9CA3AF]">
                Stop and continue to review
              </p>
            </>
          ) : (
            <div className="flex gap-4 mb-8">
              <button
                onClick={handlePauseResume}
                className="flex-1 py-4 rounded-2xl font-medium text-lg text-white flex items-center justify-center gap-3 shadow-lg shadow-blue-900/10 transition-all active:scale-[0.99]"
                style={{ backgroundColor: "#203954" }}
              >
                {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={handleStop}
                className="flex-1 py-4 rounded-2xl font-medium text-lg flex items-center justify-center gap-3 bg-white border-2 border-[#E5E7EB] text-[#203954] hover:bg-gray-50 transition-all active:scale-[0.99]"
              >
                <Square className="w-5 h-5 fill-current" />
                Finish
              </button>
            </div>
          )}

          {/* Text Option */}
          {isIdle && (
            <div className="text-center mb-8">
              <button
                onClick={onSwitchToText}
                className="text-base font-medium mb-2 text-[#203954] hover:underline decoration-[#CBA46A] underline-offset-4"
              >
                Prefer to type this story instead?
              </button>
              <p className="text-base text-[#9CA3AF]">
                Audio captures your voice best, but typing is always an option.
              </p>
            </div>
          )}

          {/* Back Button */}
          {isIdle && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#6B7280] hover:text-[#203954] transition-colors px-2 py-1 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
