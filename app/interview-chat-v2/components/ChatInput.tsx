"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Keyboard, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeInterview } from "@/hooks/use-realtime-interview";

interface ChatInputProps {
  onAudioResponse: (audioBlob: Blob, duration: number) => void;
  onTextResponse: (text: string) => void;
  onTranscriptUpdate?: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  useRealtime?: boolean; // Flag to enable Realtime API mode
  userName?: string; // User name for personalization
  realtimeConnected?: boolean; // Whether realtime session is active (for pause button)
}

export function ChatInput({
  onAudioResponse,
  onTextResponse,
  onTranscriptUpdate,
  disabled,
  useRealtime = false,
  userName,
  realtimeConnected = false
}: ChatInputProps) {
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // For realtime mode pause state
  const [textInput, setTextInput] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Traditional MediaRecorder refs (fallback mode)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Realtime API integration
  const {
    status: realtimeStatus,
    provisionalTranscript,
    voiceEnabled,
    error: realtimeError,
    startSession,
    stopSession,
    toggleVoice,
    toggleMic,
    getMixedAudioBlob,
  } = useRealtimeInterview();

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Start audio recording (Realtime API or traditional MediaRecorder)
  const startRecording = async () => {
    if (useRealtime) {
      // Realtime API mode
      try {
        startTimeRef.current = Date.now();
        setIsRecording(true);

        // Update duration timer
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingDuration(elapsed);
        }, 1000);

        await startSession(
          (finalText) => {
            // Handle final transcript
            console.log('[ChatInput] Final transcript:', finalText);
            if (onTranscriptUpdate) {
              onTranscriptUpdate(finalText, true);
            }
          },
          (error) => {
            console.error('[ChatInput] Realtime error:', error);
            alert(`Realtime API error: ${error.message}`);
            setIsRecording(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setRecordingDuration(0);
          },
          undefined, // config
          undefined, // onAssistantResponse
          undefined, // onUserSpeechStart
          userName // userName
        );
      } catch (error) {
        console.error('Failed to start Realtime session:', error);
        alert('Failed to start voice session. Please try again.');
        setIsRecording(false);
        setRecordingDuration(0);
      }
    } else {
      // Traditional MediaRecorder mode (fallback)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });

        streamRef.current = stream;
        chunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          setIsRecording(false);
          setRecordingDuration(0);

          onAudioResponse(audioBlob, duration);
        };

        mediaRecorder.start(1000);
        startTimeRef.current = Date.now();
        setIsRecording(true);

        // Update duration timer
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingDuration(elapsed);
        }, 1000);

      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Failed to access microphone. Please check permissions.');
      }
    }
  };

  // Stop audio recording (Realtime API or traditional MediaRecorder)
  const stopRecording = () => {
    if (useRealtime) {
      // Realtime API mode - get mixed audio blob and stop session
      const mixedBlob = getMixedAudioBlob();
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Clean up timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      setRecordingDuration(0);

      // Stop the Realtime session
      stopSession();

      // Send the mixed audio blob if available
      if (mixedBlob) {
        onAudioResponse(mixedBlob, duration);
      } else {
        // No audio recorded - shouldn't happen, but handle gracefully
        console.warn('[ChatInput] No mixed audio blob available');
      }
    } else {
      // Traditional MediaRecorder mode
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Toggle pause/resume for realtime mode
  // When paused: mute mic AND mute Pearl's audio output
  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    // Toggle microphone (disable when paused)
    toggleMic(!newPausedState);

    // Toggle Pearl's voice output (mute when paused)
    // Note: toggleVoice(true) = voice enabled, toggleVoice(false) = voice muted
    toggleVoice(!newPausedState);

    console.log('[ChatInput] Pause toggled:', newPausedState ? 'PAUSED' : 'RESUMED');
  };

  // Send text response
  const sendText = () => {
    if (!textInput.trim()) return;
    onTextResponse(textInput.trim());
    setTextInput('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-page-bg)] px-4 z-40"
      style={{
        paddingTop: '8px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Provisional Transcript Display (Realtime mode only) */}
      {useRealtime && isRecording && provisionalTranscript && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-white border border-[var(--hw-primary)]/20 shadow-sm">
          <p className="text-xs text-[var(--hw-text-muted)] mb-1 font-medium">Listening...</p>
          <p className="text-base text-[var(--hw-text-primary)] leading-relaxed">{provisionalTranscript}</p>
        </div>
      )}

      {/* Audio Mode (Default) */}
      {mode === 'audio' && (
        <div className="flex flex-col items-center">
          {/* Realtime Mode: Show Pause/Resume button when connected */}
          {useRealtime && realtimeConnected ? (
            <div className="flex items-center justify-center gap-4">
              {/* Switch to Text */}
              <button
                onClick={() => setMode('text')}
                className="w-10 h-10 rounded-full bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] text-[var(--hw-text-secondary)] flex items-center justify-center hover:bg-[var(--hw-section-bg)] transition-colors"
                title="Type instead"
                aria-label="Switch to typing"
              >
                <Keyboard className="w-5 h-5" />
              </button>

              {/* Pause/Resume Button - 60px */}
              <button
                onClick={togglePause}
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isPaused
                    ? 'bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)]'
                    : 'bg-[var(--hw-warning-accent)] hover:bg-amber-600'
                }`}
                aria-label={isPaused ? "Resume conversation" : "Pause conversation"}
              >
                {isPaused ? (
                  <Play className="w-7 h-7 text-white ml-1" />
                ) : (
                  <Pause className="w-7 h-7 text-white" />
                )}
              </button>

              {/* Spacer for balance */}
              <div className="w-10" />
            </div>
          ) : isRecording ? (
            /* Traditional Recording Mode: Show Stop button */
            <div className="flex items-center justify-center gap-4">
              {/* Recording Indicator & Timer */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                <div className="w-2 h-2 bg-[var(--hw-error)] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[var(--hw-error)] tabular-nums">
                  {formatTime(recordingDuration)}
                </span>
              </div>

              {/* Stop Button - 60px per design guidelines */}
              <button
                onClick={stopRecording}
                className="w-[60px] h-[60px] rounded-full bg-[var(--hw-error)] hover:bg-red-700 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                aria-label="Stop recording"
              >
                <Square className="w-6 h-6 text-white fill-white" />
              </button>
            </div>
          ) : (
            /* Traditional Mode: Show Record button (when not realtime or not connected) */
            <div className="flex items-center justify-center gap-4">
              {/* Switch to Text - Keyboard icon is clearer */}
              <button
                onClick={() => setMode('text')}
                className="w-10 h-10 rounded-full bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] text-[var(--hw-text-secondary)] flex items-center justify-center hover:bg-[var(--hw-section-bg)] transition-colors"
                title="Type instead"
                aria-label="Switch to typing"
              >
                <Keyboard className="w-5 h-5" />
              </button>

              {/* RECORD BUTTON - 60px centered, iPhone camera style */}
              <button
                onClick={startRecording}
                disabled={disabled}
                className="w-[60px] h-[60px] rounded-full bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                aria-label="Start recording"
              >
                <Mic className="w-7 h-7 text-white" />
              </button>

              {/* Spacer for balance */}
              <div className="w-10" />
            </div>
          )}

          {/* Helper Text - compact */}
          {useRealtime && realtimeConnected ? (
            <p className="text-xs text-[var(--hw-text-muted)] mt-1">
              {isPaused ? 'Tap to resume' : 'Tap to pause conversation'}
            </p>
          ) : !isRecording && (
            <p className="text-xs text-[var(--hw-text-muted)] mt-1">
              Tap to answer
            </p>
          )}
        </div>
      )}

      {/* Text Mode */}
      {mode === 'text' && (
        <div className="flex items-end gap-2">
          {/* Switch back to Audio */}
          <button
            onClick={() => setMode('audio')}
            className="mb-1 w-10 h-10 rounded-full bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] text-[var(--hw-text-secondary)] flex items-center justify-center hover:bg-[var(--hw-section-bg)] transition-colors flex-shrink-0"
            title="Switch to voice"
            aria-label="Switch to voice recording"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            disabled={disabled}
            placeholder="Type your response..."
            className="flex-1 resize-none px-4 py-2 rounded-xl border border-[var(--hw-border-subtle)] bg-[var(--hw-surface)] focus:border-[var(--hw-primary)] focus:ring-2 focus:ring-[var(--hw-primary)]/20 focus:outline-none text-base text-[var(--hw-text-primary)] placeholder:text-[var(--hw-text-muted)] disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '100px' }}
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={sendText}
            disabled={disabled || !textInput.trim()}
            className="mb-1 w-10 h-10 rounded-full bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
