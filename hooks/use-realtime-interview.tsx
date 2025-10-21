/**
 * Realtime Interview Hook
 *
 * Manages OpenAI Realtime API WebRTC connection for guided interviews.
 * Replaces broken Whisper blob-slicing transcription with real-time streaming.
 *
 * Features:
 * - Live transcript updates (provisional → final)
 * - Voice toggle for audio output
 * - Barge-in support (pause Pearl when user speaks)
 * - Mixed audio recording for family book
 * - Auto-reconnection on failures
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { startRealtime, RealtimeHandles, RealtimeConfig } from '@/lib/realtimeClient';
import { startMixedRecorder } from '@/lib/mixedRecorder';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Pearl's conversational AI instructions for V2
export const PEARL_INSTRUCTIONS = `You are Pearl, a warm and empathetic interview guide for Heritage Whisper, helping seniors capture their life stories.

Your role:
- After the user shares something, ask ONE brief follow-up question (10-20 words max)
- Dig deeper into emotions, sensory details, relationships, or lessons learned
- Show you're actively listening by referencing what they just said
- Be warm, curious, and respectful - never rush them

Good questions explore:
- "How did that make you feel?"
- "What do you remember most vividly about that moment?"
- "What did that teach you about yourself?"
- "Who else was there, and how did they react?"

Keep it conversational and natural. One question at a time.`;

export function useRealtimeInterview() {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [provisionalTranscript, setProvisionalTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const realtimeHandlesRef = useRef<RealtimeHandles | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mixedRecorderRef = useRef<{ stop: () => void } | null>(null);
  const mixedAudioBlobRef = useRef<Blob | null>(null);

  // Start Realtime session
  const startSession = useCallback(async (
    onTranscriptFinal: (text: string) => void,
    onError?: (error: Error) => void,
    config?: RealtimeConfig
  ) => {
    try {
      setStatus('connecting');
      setError(null);

      const handles = await startRealtime({
        // Live transcript updates (gray provisional text)
        onTranscriptDelta: (text) => {
          setProvisionalTranscript(prev => prev + text);
        },

        // Final transcript (lock to black, trigger follow-up)
        onTranscriptFinal: (text) => {
          console.log('[RealtimeInterview] Final transcript:', text);
          setProvisionalTranscript(''); // Clear provisional
          onTranscriptFinal(text);
        },

        // Assistant audio output (voice mode + mixed recording)
        onAssistantAudio: (stream) => {
          // Play audio if voice enabled
          if (voiceEnabled && !audioElementRef.current) {
            console.log('[RealtimeInterview] Playing assistant audio');
            const audio = new Audio();
            audio.srcObject = stream;
            audio.play().catch(err => console.error('Audio play failed:', err));
            audioElementRef.current = audio;
          }

          // Start mixed recorder if we have mic stream (use ref to access handles)
          setTimeout(() => {
            const micStream = realtimeHandlesRef.current?.mic;
            if (micStream && !mixedRecorderRef.current) {
              console.log('[RealtimeInterview] Starting mixed recorder...');
              const recorder = startMixedRecorder({
                micStream,
                botStream: stream,
                onStop: (blob) => {
                  console.log('[RealtimeInterview] Mixed recording stopped:', blob.size, 'bytes');
                  mixedAudioBlobRef.current = blob;
                },
              });
              mixedRecorderRef.current = recorder;
            }
          }, 100);
        },

        // Barge-in: Pause audio when user speaks
        onSpeechStarted: () => {
          console.log('[RealtimeInterview] User speech started - pausing assistant');
          if (audioElementRef.current) {
            audioElementRef.current.pause();
          }
        },

        // Connection established
        onConnected: () => {
          console.log('[RealtimeInterview] Connected successfully');
          setStatus('connected');
        },

        // Error handling
        onError: (err) => {
          console.error('[RealtimeInterview] Error:', err);
          setError(err.message);
          setStatus('error');
          onError?.(err);
        },
      }, process.env.NEXT_PUBLIC_OPENAI_API_KEY || '', config);

      realtimeHandlesRef.current = handles;

    } catch (err) {
      console.error('[RealtimeInterview] Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setStatus('error');
    }
  }, [voiceEnabled]);

  // Start mixed recorder once we have both streams
  const startMixedRecording = useCallback((assistantStream: MediaStream) => {
    const micStream = realtimeHandlesRef.current?.mic;
    if (!micStream || !assistantStream) {
      console.warn('[RealtimeInterview] Missing streams for mixed recording');
      return;
    }

    console.log('[RealtimeInterview] Starting mixed recorder...');
    const recorder = startMixedRecorder({
      micStream,
      botStream: assistantStream,
      onStop: (blob) => {
        console.log('[RealtimeInterview] Mixed recording stopped:', blob.size, 'bytes');
        mixedAudioBlobRef.current = blob;
      },
    });

    mixedRecorderRef.current = recorder;
  }, []);

  // Stop session and mixed recording
  const stopSession = useCallback(() => {
    console.log('[RealtimeInterview] Stopping session...');

    // Stop mixed recorder
    if (mixedRecorderRef.current) {
      mixedRecorderRef.current.stop();
      mixedRecorderRef.current = null;
    }

    // Stop audio playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }

    // Stop Realtime connection
    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.stop();
      realtimeHandlesRef.current = null;
    }

    setStatus('disconnected');
    setProvisionalTranscript('');
  }, []);

  // Toggle voice output
  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  // Get mixed audio blob for upload
  const getMixedAudioBlob = useCallback(() => {
    return mixedAudioBlobRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    status,
    provisionalTranscript,
    voiceEnabled,
    error,
    startSession,
    stopSession,
    toggleVoice,
    startMixedRecording,
    getMixedAudioBlob,
  };
}
