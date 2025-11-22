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
  userName?: string; // User name for personalization
}

export function ChatInput({
  onAudioResponse,
  onTextResponse,
  onTranscriptUpdate,
  disabled,
  useRealtime = false,
  userName
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
      className="sticky left-0 right-0 border-t border-amber-100 bg-[#fffdf5] px-4 sm:px-6 py-4 sm:py-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
      style={{
        bottom: isMobile ? 'max(80px, env(safe-area-inset-bottom, 0px))' : '0px',
      }}
    >
      {/* Provisional Transcript Display (Realtime mode only) */}
      {useRealtime && isRecording && provisionalTranscript && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-white border border-amber-100 shadow-sm">
          <p className="text-xs text-amber-800/60 mb-1 font-medium uppercase tracking-wider">Listening...</p>
          <p className="text-lg text-gray-700 font-serif italic leading-relaxed">{provisionalTranscript}</p>
        </div>
      )}

      {/* Audio Mode (Default) */}
      {mode === 'audio' && (
        <div className="flex flex-col items-center gap-4">
          {isRecording ? (
            <div className="w-full flex items-center gap-4">
              {/* Recording Indicator & Timer */}
              <div className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-50 border border-red-100 shadow-inner">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-medium text-red-800 tabular-nums tracking-widest">
                  {formatTime(recordingDuration)}
                </span>
              </div>

              {/* Stop Button */}
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95"
                aria-label="Stop recording"
              >
                <Square className="w-7 h-7 text-white fill-white" />
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-4">
              {/* Switch to Text (Small) */}
              <button
                onClick={() => setMode('text')}
                className="w-12 h-12 rounded-full bg-white border border-amber-200 text-amber-700 flex items-center justify-center hover:bg-amber-50 transition-colors"
                title="Type instead"
              >
                <Type className="w-5 h-5" />
              </button>

              {/* BIG RECORD BUTTON */}
              <button
                onClick={startRecording}
                disabled={disabled}
                className="group relative flex items-center justify-center"
                aria-label="Start recording"
              >
                {/* Pulsing rings */}
                <div className="absolute inset-0 bg-amber-400 rounded-full opacity-20 group-hover:animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/30 transition-transform group-hover:scale-105 active:scale-95">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              </button>

              {/* Spacer for balance */}
              <div className="w-12" />
            </div>
          )}

          {/* Helper Text */}
          {!isRecording && (
            <p className="text-base text-amber-900/60 font-medium">
              Tap to answer
            </p>
          )}
        </div>
      )}

      {/* Text Mode */}
      {mode === 'text' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            {/* Switch back to Audio */}
            <button
              onClick={() => setMode('audio')}
              className="mb-1 w-10 h-10 rounded-full bg-white border border-amber-200 text-amber-700 flex items-center justify-center hover:bg-amber-50 transition-colors flex-shrink-0"
              title="Switch to voice"
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
              placeholder="Type your story here..."
              className="flex-1 resize-none px-5 py-4 rounded-2xl border border-amber-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-lg placeholder:text-amber-900/30 disabled:opacity-50"
              style={{ minHeight: '60px', maxHeight: '150px' }}
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={sendText}
              disabled={disabled || !textInput.trim()}
              className="mb-1 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 flex-shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
