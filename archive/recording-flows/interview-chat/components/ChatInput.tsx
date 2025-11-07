"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Type, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeInterview } from "@/hooks/use-realtime-interview";

interface ChatInputProps {
  onAudioResponse: (audioBlob: Blob, duration: number) => void;
  onTextResponse: (text: string) => void;
  onTranscriptUpdate?: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  useRealtime?: boolean; // Flag to enable Realtime API mode
}

export function ChatInput({
  onAudioResponse,
  onTextResponse,
  onTranscriptUpdate,
  disabled,
  useRealtime = false
}: ChatInputProps) {
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [isRecording, setIsRecording] = useState(false);
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
          }
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
      className="sticky left-0 right-0 border-t border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 z-40"
      style={{
        // On mobile: stick 80px from bottom (above mobile nav bar which is 80px tall)
        // On desktop: stick to bottom (0px)
        // Also account for safe area insets on notched phones
        bottom: isMobile ? 'max(80px, env(safe-area-inset-bottom, 0px))' : '0px',
      }}
    >
      {/* Mode Toggle - more compact on mobile */}
      <div className="flex justify-center mb-2 sm:mb-3 gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 sm:p-1 bg-gray-50">
          <button
            onClick={() => setMode('audio')}
            disabled={disabled || isRecording}
            className={`flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'audio'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mic className="w-4 h-4 mr-1" />
            <span>Audio</span>
          </button>
          <button
            onClick={() => setMode('text')}
            disabled={disabled || isRecording}
            className={`flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Type className="w-4 h-4 mr-1" />
            <span>Type</span>
          </button>
        </div>

        {/* Voice Toggle (only in Realtime mode and when recording) */}
        {useRealtime && mode === 'audio' && isRecording && (
          <button
            onClick={toggleVoice}
            className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              voiceEnabled
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={voiceEnabled ? 'Voice ON - Click to mute' : 'Voice OFF - Click to unmute'}
          >
            {voiceEnabled ? (
              <><Volume2 className="w-4 h-4 mr-1" /> Voice ON</>
            ) : (
              <><VolumeX className="w-4 h-4 mr-1" /> Voice OFF</>
            )}
          </button>
        )}
      </div>

      {/* Provisional Transcript Display (Realtime mode only) */}
      {useRealtime && isRecording && provisionalTranscript && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Live transcription:</p>
          <p className="text-sm text-gray-600 italic">{provisionalTranscript}</p>
        </div>
      )}

      {/* Audio Mode */}
      {mode === 'audio' && (
        <div className="flex items-center gap-3">
          {isRecording ? (
            <>
              {/* Recording indicator */}
              <div className="flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-red-700">
                    Recording
                  </span>
                </div>
                <span className="text-sm font-mono text-red-600 tabular-nums">
                  {formatTime(recordingDuration)}
                </span>
              </div>

              {/* Stop button */}
              <button
                onClick={stopRecording}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors flex-shrink-0"
                aria-label="Stop recording"
              >
                <Square className="w-6 h-6 text-white fill-white" />
              </button>
            </>
          ) : (
            <>
              {/* Instructions */}
              <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600 text-center">
                Tap the microphone to record your answer
              </div>

              {/* Record button */}
              <button
                onClick={startRecording}
                disabled={disabled}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 flex items-center justify-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Start recording"
              >
                <Mic className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Text Mode */}
      {mode === 'text' && (
        <div className="flex items-end gap-3">
          {/* Text input */}
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
            placeholder="Type your answer here..."
            className="flex-1 resize-none px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-base disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '56px', maxHeight: '120px' }}
            rows={1}
          />

          {/* Send button */}
          <button
            onClick={sendText}
            disabled={disabled || !textInput.trim()}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 flex items-center justify-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Helper text */}
      {!isRecording && (
        <p className="text-sm text-gray-500 text-center mt-3">
          {mode === 'audio'
            ? 'Speak naturally and take your time'
            : 'Press Enter to send, Shift+Enter for new line'
          }
        </p>
      )}
    </div>
  );
}
