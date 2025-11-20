"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Pause, Play, Square, Save, Type } from "lucide-react";
import { type AudioRecordingScreenProps, type RecordingState } from "../types";
import { WaveformVisualizer } from "./WaveformVisualizer";
import "../recording-v3.css";

/**
 * AudioRecordingScreen - Core recording experience
 * Full MediaRecorder integration with pause/resume, waveform, and controls
 * Based on heritage-whisper-recorder reference implementation
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

  const MAX_DURATION_SECONDS = 300; // 5 minutes

  // Initialize recording
  useEffect(() => {
    startRecording();
    return cleanup;
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording in chunks
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
        // Auto-stop at max duration
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

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

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

    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop recording
    mediaRecorderRef.current.stop();

    // Wait for final data
    await new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => resolve();
      }
    });

    // Create audio blob
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

    // Update draft and finish
    const completeDraft = {
      ...draft,
      title: draft.title || "Untitled Story",
      audioBlob,
      durationSeconds: elapsedSeconds,
      recordingMode: (draft.photoUrl ? "photo_audio" : "audio") as "photo_audio" | "audio",
    };

    onFinishAndReview(completeDraft as any);
    cleanup();
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

  const handleSwitchToText = () => {
    if (confirm("Switch to text mode? Your recording will be discarded.")) {
      cleanup();
      onSwitchToText();
    }
  };

  const cleanup = () => {
    // Stop timer
    stopTimer();

    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop media recorder
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }

    // Close audio context
    audioContextRef.current?.close();

    // Stop all tracks
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isProcessing = recordingState === "processing";

  return (
    <div className="hw-screen-wrapper">
      {/* Header */}
      <div className="hw-screen-header">
        <button
          onClick={onBack}
          className="hw-btn-icon hw-btn-ghost"
          aria-label="Back"
          disabled={isProcessing}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {draft.photoUrl && (
            <img
              src={draft.photoUrl}
              alt="Story photo"
              className="w-8 h-8 rounded object-cover"
            />
          )}
          <h1 className="hw-heading-md">{draft.title || "Recording..."}</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="hw-screen-content">
        <div className="hw-stack-lg">
          {/* Timer */}
          <div className="hw-text-center">
            <div className="hw-timer">{formatTime(elapsedSeconds)}</div>
            <p className="hw-body-sm hw-text-muted mt-2">
              {MAX_DURATION_SECONDS - elapsedSeconds > 0
                ? `${MAX_DURATION_SECONDS - elapsedSeconds}s remaining`
                : "Maximum duration reached"}
            </p>
          </div>

          {/* Waveform */}
          <WaveformVisualizer isRecording={isRecording} audioLevel={audioLevel} />

          {/* Guidance Text */}
          <div className="hw-text-center">
            <p className="hw-body-base hw-text-muted">
              {isRecording && "Take your time. You can pause anytime..."}
              {isPaused && "Paused. Tap to resume when ready."}
              {isProcessing && "Processing your recording..."}
            </p>
          </div>

          {/* Main Controls */}
          <div className="flex justify-center gap-4">
            {/* Pause/Resume Button */}
            <button
              onClick={handlePauseResume}
              disabled={isProcessing}
              className="hw-btn hw-btn-primary hw-btn-lg"
              style={{ minWidth: "120px" }}
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              )}
            </button>

            {/* Stop/Finish Button */}
            <button
              onClick={handleStop}
              disabled={isProcessing || elapsedSeconds < 1}
              className="hw-btn hw-btn-secondary hw-btn-lg"
            >
              <Square className="w-5 h-5" />
              Finish
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="hw-stack-sm mt-4">
            {onSaveForLater && (
              <button
                onClick={handleSaveForLater}
                disabled={isProcessing}
                className="hw-btn hw-btn-ghost w-full"
              >
                <Save className="w-5 h-5" />
                Save for Later
              </button>
            )}
            <button
              onClick={handleSwitchToText}
              disabled={isProcessing}
              className="hw-btn hw-btn-ghost w-full"
            >
              <Type className="w-5 h-5" />
              Switch to Text
            </button>
          </div>

          {/* Hint */}
          <div className="hw-card mt-4">
            <p className="hw-body-sm hw-text-muted">
              💡 <strong>Tip:</strong> Speak naturally as if telling a friend. Don't
              worry about perfection – you can edit the transcript later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
