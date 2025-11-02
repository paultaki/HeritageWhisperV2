"use client";

/**
 * OpenAI Realtime API Test Page
 *
 * Standalone test page for WebRTC integration.
 * Use this to verify Realtime API works before integrating into interview-chat.
 *
 * Access: http://localhost:3002/realtime-test
 *
 * Requirements:
 * - OPENAI_API_KEY configured in .env.local
 * - NEXT_PUBLIC_ENABLE_REALTIME=true in .env.local
 * - User must be authenticated
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { startRealtime, RealtimeHandles } from '@/lib/realtimeClient';
import { startMixedRecorder } from '@/lib/mixedRecorder';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function RealtimeTestPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [provisionalText, setProvisionalText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const realtimeHandlesRef = useRef<RealtimeHandles | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mixedRecorderRef = useRef<{ stop: () => void } | null>(null);
  const assistantStreamRef = useRef<MediaStream | null>(null);

  // Check feature flag
  const isRealtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true';

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Start Realtime session
  const handleStart = async () => {
    try {
      setStatus('connecting');
      setError(null);
      setProvisionalText('');
      setFinalText('');

      console.log('[RealtimeTest] Starting session...');

      const handles = await startRealtime({
        onTranscriptDelta: (text) => {
          console.log('[RealtimeTest] Delta:', text);
          setProvisionalText(prev => prev + text);
        },

        onTranscriptFinal: (text) => {
          console.log('[RealtimeTest] Final:', text);
          setFinalText(prev => prev + '\n' + text);
          setProvisionalText('');
        },

        onAssistantAudio: (stream) => {
          console.log('[RealtimeTest] Assistant audio stream received');
          assistantStreamRef.current = stream;

          // Play audio if voice enabled
          if (voiceEnabled && !audioElementRef.current) {
            const audio = new Audio();
            audio.srcObject = stream;
            audio.play().catch(err => console.error('[RealtimeTest] Audio play failed:', err));
            audioElementRef.current = audio;
          }

          // Start mixed recorder if we have mic (use realtimeHandlesRef which will be set)
          // Delay slightly to ensure handles are fully initialized
          setTimeout(() => {
            if (realtimeHandlesRef.current?.mic && !mixedRecorderRef.current) {
              console.log('[RealtimeTest] Starting mixed recorder...');
              const recorder = startMixedRecorder({
                micStream: realtimeHandlesRef.current.mic,
                botStream: stream,
                onStop: (blob) => {
                  console.log('[RealtimeTest] Mixed audio stopped:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
                },
              });
              mixedRecorderRef.current = recorder;
            }
          }, 100);
        },

        onSpeechStarted: () => {
          console.log('[RealtimeTest] Speech started - pausing assistant');
          if (audioElementRef.current) {
            audioElementRef.current.pause();
          }
        },

        onConnected: () => {
          console.log('[RealtimeTest] Connected!');
          setStatus('connected');
        },

        onError: (err) => {
          console.error('[RealtimeTest] Error:', err);
          setError(err.message);
          setStatus('error');
        },
      }, process.env.NEXT_PUBLIC_OPENAI_API_KEY || '');

      realtimeHandlesRef.current = handles;

    } catch (err) {
      console.error('[RealtimeTest] Failed to start:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setStatus('error');
    }
  };

  // Stop session
  const handleStop = () => {
    console.log('[RealtimeTest] Stopping...');

    if (mixedRecorderRef.current) {
      mixedRecorderRef.current.stop();
      mixedRecorderRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }

    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.stop();
      realtimeHandlesRef.current = null;
    }

    setStatus('disconnected');
    setProvisionalText('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isRealtimeEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Realtime API Disabled</h1>
          <p className="text-gray-600 mb-4">
            Set <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_ENABLE_REALTIME=true</code> in your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file to enable this feature.
          </p>
          <button
            onClick={() => router.push('/timeline')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Timeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">OpenAI Realtime API Test</h1>
            <p className="text-gray-600">
              Test WebRTC connection, live transcription, and voice output
            </p>
          </div>

          {/* Status */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'connected' ? 'bg-green-100 text-green-800' :
                status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800"><strong>Error:</strong> {error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="mb-8 flex gap-4">
            <button
              onClick={handleStart}
              disabled={status === 'connected' || status === 'connecting'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Session
            </button>

            <button
              onClick={handleStop}
              disabled={status === 'disconnected'}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop Session
            </button>

            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-6 py-3 rounded-lg font-medium ${
                voiceEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
            </button>
          </div>

          {/* Instructions */}
          {status === 'connected' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Try speaking!</strong> Your words will appear below in real-time.
              </p>
            </div>
          )}

          {/* Transcripts */}
          <div className="space-y-4">
            {/* Provisional (live) */}
            {provisionalText && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Provisional (live):</p>
                <p className="text-gray-600 italic">{provisionalText}</p>
              </div>
            )}

            {/* Final transcripts */}
            {finalText && (
              <div className="p-4 bg-white rounded-lg border border-gray-300">
                <p className="text-xs font-medium text-gray-700 mb-2">Final transcripts:</p>
                <div className="text-gray-900 whitespace-pre-wrap">{finalText}</div>
              </div>
            )}
          </div>

          {/* Model info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Model:</strong> gpt-realtime-mini<br />
              <strong>Cost:</strong> ~$1.13 per 15-min interview<br />
              <strong>Transport:</strong> WebRTC (48kHz Opus)<br />
              <strong>VAD:</strong> Server-side (300ms silence/prefix)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
