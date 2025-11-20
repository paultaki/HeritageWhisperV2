"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Pause, Play, Square, Mic } from "lucide-react";
import { type AudioRecordingScreenProps, type RecordingState } from "../types";
import "../recording-v3.css";

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
      analyser.fftSize = 256;
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

  // Waveform visualization
  const waveformBars = Array.from({ length: 12 }, (_, i) => {
    if (isIdle) return 0.2;
    const baseHeight = 0.2 + audioLevel * 0.6;
    const waveOffset = Math.sin((Date.now() / 300) + (i * 0.5)) * 0.15;
    const randomness = Math.random() * 0.1;
    return Math.max(0.15, Math.min(0.95, baseHeight + waveOffset + randomness));
  });

  return (
    <div style={{ backgroundColor: "#F5F1ED", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ maxWidth: "650px", margin: "0 auto", width: "100%" }}>
        <div className="flex items-center gap-3">
          <img
            src="/final logo/logo hw.svg"
            alt="HW"
            className="w-12 h-12"
          />
          <div className="leading-tight">
            <h1 className="font-bold text-lg tracking-wide m-0" style={{ color: "#2C3E50", lineHeight: "1.2" }}>
              HERITAGE WHISPER
            </h1>
            <p className="text-sm m-0" style={{ color: "#6B7280", lineHeight: "1.3" }}>
              {draft.title || "Record your story"}
            </p>
          </div>
        </div>
        {onSaveForLater && (
          <button
            onClick={handleSaveForLater}
            className="text-base font-medium"
            style={{ color: "#6B7280" }}
          >
            Save later
          </button>
        )}
      </div>

      {/* Photo Preview */}
      {draft.photoUrl && (
        <div className="mx-6 mb-6 relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/10", maxWidth: "600px", margin: "0 auto 1.5rem auto" }}>
          <img src={draft.photoUrl} alt="Story" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4">
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
        <div className="bg-white rounded-2xl p-8 mb-4 shadow-sm">
          <div className="flex items-center justify-center gap-1 h-20">
            {waveformBars.map((height, index) => (
              <div
                key={index}
                className="w-1 rounded-full transition-all duration-100"
                style={{
                  height: `${height * 80}px`,
                  backgroundColor: isIdle ? "#D1D5DB" : "#10B981"
                }}
              />
            ))}
          </div>
          <p className="text-center text-sm mt-4" style={{ color: "#9CA3AF" }}>
            {isIdle ? "READY TO RECORD" : isRecording ? "RECORDING" : "PAUSED"}
          </p>
        </div>

        {/* Tip */}
        <div className="mb-6">
          <p className="text-lg hw-text-center" style={{ color: "#6B7280" }}>
            Take your time. You can pause anytime and edit later.
          </p>
        </div>

        {/* Controls */}
        {isIdle ? (
          <>
            <button
              onClick={startRecording}
              className="w-full py-4 rounded-xl font-medium text-base text-white flex items-center justify-center gap-2 mb-4"
              style={{ backgroundColor: "#2C3E50" }}
            >
              <Mic className="w-5 h-5" />
              Start recording
            </button>
            <p className="text-base hw-text-center mb-6" style={{ color: "#9CA3AF" }}>
              Stop and continue to review
            </p>
          </>
        ) : (
          <div className="flex gap-3 mb-4">
            <button
              onClick={handlePauseResume}
              className="flex-1 py-3 rounded-xl font-medium text-base text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: "#2C3E50" }}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={handleStop}
              className="flex-1 py-3 rounded-xl font-medium text-base flex items-center justify-center gap-2"
              style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#2C3E50" }}
            >
              <Square className="w-5 h-5" />
              Finish
            </button>
          </div>
        )}

        {/* Text Option */}
        {isIdle && (
          <div className="hw-text-center mb-6" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button
              onClick={onSwitchToText}
              className="text-base font-medium mb-2"
              style={{ color: "#2C3E50" }}
            >
              Prefer to type this story instead?
            </button>
            <p className="text-base hw-text-center" style={{ color: "#9CA3AF" }}>
              Audio captures your voice best, but typing is always an option.
            </p>
          </div>
        )}

        {/* Back Button */}
        {isIdle && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: "#6B7280" }} />
          </button>
        )}
      </div>
    </div>
  );
}
