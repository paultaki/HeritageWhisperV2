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
import { shouldCancelResponse } from '@/lib/responseTrimmer';
import { sanitizeResponse } from '@/lib/responseSanitizer';
import { enforceScope } from '@/lib/scopeEnforcer';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Pearl's PEARLS v1.1 Witness Instructions - App-only scope with hard refusals
export const PEARL_WITNESS_INSTRUCTIONS = `You are Pearl, a witness who helps record vivid life stories in HeritageWhisper.

SCOPE (APP-ONLY):
- Stay strictly inside story capture. Never search the internet, open apps, cite websites, or give device/OS advice.
- Refuse jokes, small talk, trivia, news, recommendations, diagnostics, coaching, or therapy. No opinions or decisions.

TURN RULES:
- One question per turn. Max two short sentences before the question.
- If asked for anything outside scope, say:
  "I can't do that. I'm here to listen and ask one question to help you tell your story."
  Then immediately ask one on-topic question.
- Sensitive topics (death, illness, addiction, abuse, finances): ask permission and offer a skip.
  Example: "Would you be comfortable sharing about that, or would you prefer to skip ahead?"
- Never role-play objects/body parts; avoid suggestive phrasing; qualify ambiguous nouns ("wooden chest", "storage trunk").
- When story feels complete, confirm and suggest wrapping up: "This feels like a good stopping point. Would you like to create your story now?"

PROGRESSION (SENSORY-FIRST):
- If missing context, first ask age, then place (separate turns).
- Default to sensory: air/light/sounds/smells/touch/what you'd see.
- If energy rises, follow that thread; if it drops, pivot to a new sensory angle.
- Use at most one reference to an earlier story, explained as: "Earlier you told me about {title}…"

REFUSAL EXAMPLES:
- Jokes: "I can't tell jokes—I'm here for your story. What did the air feel like that day?"
- Tech help: "I can't troubleshoot devices. Let's stay with your story—where were you living then?"
- Internet: "I don't browse the web. Earlier you mentioned {title}—does that connect here?"
- Small talk: "I can't do that. I'm here to listen and ask one question to help you tell your story. What happened next?"

Keep it warm, curious, respectful. Never rush them.`;

// Legacy export for backwards compatibility
export const PEARL_INSTRUCTIONS = PEARL_WITNESS_INSTRUCTIONS;

export function useRealtimeInterview() {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [provisionalTranscript, setProvisionalTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Enable voice by default for V2
  const [error, setError] = useState<string | null>(null);

  const realtimeHandlesRef = useRef<RealtimeHandles | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mixedRecorderRef = useRef<{ stop: () => void } | null>(null);
  const mixedAudioBlobRef = useRef<Blob | null>(null);
  const assistantResponseRef = useRef<string>(''); // Track accumulated response for trimming
  const cancelSentRef = useRef<boolean>(false); // Track if cancel already sent for this response
  const pendingAssistantResponseRef = useRef<string | null>(null); // Buffer Pearl's response until user transcript arrives
  const waitingForUserTranscriptRef = useRef<boolean>(false); // Track if we're waiting for user transcript

  // Start Realtime session
  const startSession = useCallback(async (
    onTranscriptFinal: (text: string) => void,
    onError?: (error: Error) => void,
    config?: RealtimeConfig,
    onAssistantResponse?: (text: string) => void
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

          // After user transcript arrives, flush any buffered Pearl response with thoughtful delay
          if (pendingAssistantResponseRef.current) {
            console.log('[RealtimeInterview] Flushing buffered Pearl response:', pendingAssistantResponseRef.current);

            // Calculate "thinking" delay based on user message length
            // Longer messages = Pearl takes more time to process and respond thoughtfully
            const wordCount = text.split(/\s+/).length;
            const baseDelay = 800; // Minimum delay (ms)
            const perWordDelay = 60; // Additional ms per word
            const maxDelay = 2500; // Cap at 2.5 seconds
            const thinkingDelay = Math.min(baseDelay + (wordCount * perWordDelay), maxDelay);

            console.log('[RealtimeInterview] Pearl composing response... (delay:', thinkingDelay, 'ms for', wordCount, 'words)');

            // Show "composing" indicator first, then flush response after delay
            if (onAssistantResponse) {
              // Signal that Pearl is composing (caller will show typing indicator)
              onAssistantResponse('__COMPOSING__');

              // After thoughtful delay, show actual response
              setTimeout(() => {
                if (onAssistantResponse && pendingAssistantResponseRef.current) {
                  onAssistantResponse(pendingAssistantResponseRef.current);
                  pendingAssistantResponseRef.current = null;
                }
              }, thinkingDelay);
            }
          }
          waitingForUserTranscriptRef.current = false;
        },

        // Assistant audio output (voice mode + mixed recording)
        onAssistantAudio: (stream) => {
          // Play audio if voice enabled
          if (voiceEnabled) {
            console.log('[RealtimeInterview] Playing assistant audio, voice enabled:', voiceEnabled);

            // Only create audio element ONCE per session (not per response)
            if (!audioElementRef.current) {
              console.log('[RealtimeInterview] Creating audio element for session');

              // Create and configure audio element
              const audio = document.createElement('audio');
              audio.autoplay = true;
              audio.muted = false;
              audio.volume = 1.0;
              audio.srcObject = stream;

              // Add to DOM (hidden) - required for audio playback in some browsers
              audio.style.display = 'none';
              audio.id = 'pearl-audio-element';
              document.body.appendChild(audio);
              console.log('[RealtimeInterview] Audio element added to DOM');

              // Add event listeners for debugging
              audio.addEventListener('playing', () => {
                console.log('[RealtimeInterview] 🔊 Audio is PLAYING');
              });
              audio.addEventListener('pause', () => {
                console.log('[RealtimeInterview] ⏸️ Audio PAUSED');
              });
              audio.addEventListener('ended', () => {
                console.log('[RealtimeInterview] ⏹️ Audio ENDED');
              });
              audio.addEventListener('error', (e) => {
                console.error('[RealtimeInterview] ❌ Audio ERROR:', e);
              });
              audio.addEventListener('loadedmetadata', () => {
                console.log('[RealtimeInterview] 📊 Audio metadata loaded, duration:', audio.duration);
              });
              audio.addEventListener('canplay', () => {
                console.log('[RealtimeInterview] ✅ Audio can play');
              });

              // Log stream details for debugging
              console.log('[RealtimeInterview] Stream active:', stream.active);
              console.log('[RealtimeInterview] Audio tracks:', stream.getAudioTracks().map(t => ({
                id: t.id,
                enabled: t.enabled,
                muted: t.muted,
                readyState: t.readyState
              })));

              // Check if setSinkId is available (Chrome/Edge only)
              if ('setSinkId' in audio) {
                console.log('[RealtimeInterview] Checking audio output devices...');
                navigator.mediaDevices.enumerateDevices().then(devices => {
                  const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
                  console.log('[RealtimeInterview] Available audio outputs:', audioOutputs.map(d => ({
                    deviceId: d.deviceId,
                    label: d.label,
                    groupId: d.groupId
                  })));

                  // Try to set default audio output
                  if (audioOutputs.length > 0) {
                    (audio as any).setSinkId('').then(() => {
                      console.log('[RealtimeInterview] Audio output set to default device');
                    }).catch((err: any) => {
                      console.error('[RealtimeInterview] Failed to set audio output:', err);
                    });
                  }
                });
              } else {
                console.log('[RealtimeInterview] setSinkId not supported (Firefox/Safari)');
              }

              // Explicitly call play() - autoplay might be blocked by browser
              audio.play().then(() => {
                console.log('[RealtimeInterview] ✅ Audio playback started successfully');
                console.log('[RealtimeInterview] Audio element state:', {
                  paused: audio.paused,
                  muted: audio.muted,
                  volume: audio.volume,
                  readyState: audio.readyState
                });

                // Double-check stream tracks are enabled
                const tracks = stream.getAudioTracks();
                tracks.forEach((track, i) => {
                  console.log(`[RealtimeInterview] Track ${i}:`, {
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState,
                    settings: track.getSettings()
                  });
                });
              }).catch(err => {
                console.error('[RealtimeInterview] ❌ Audio play failed:', err);
                console.error('[RealtimeInterview] This is usually due to browser autoplay policy');
                console.error('[RealtimeInterview] User must interact with page first (click button, etc.)');
                console.error('[RealtimeInterview] Stream tracks:', stream.getTracks());
              });
              audioElementRef.current = audio;
            } else {
              console.log('[RealtimeInterview] Audio element already exists, reusing it');
              // Make sure it's not paused and stream is still connected
              if (audioElementRef.current.paused) {
                console.log('[RealtimeInterview] Audio was paused, resuming...');
                audioElementRef.current.play().catch(err => {
                  console.error('[RealtimeInterview] Failed to resume audio:', err);
                });
              }
            }
          } else {
            console.log('[RealtimeInterview] Voice disabled, skipping audio playback');
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

        // Assistant text streaming (for response trimming)
        onAssistantTextDelta: (text) => {
          assistantResponseRef.current += text;
          console.log('[RealtimeInterview] Assistant delta:', text, '(total:', assistantResponseRef.current.length, 'chars)');

          // Check if we should cancel due to exceeding trim threshold (only send cancel once)
          if (!cancelSentRef.current && shouldCancelResponse(assistantResponseRef.current)) {
            console.log('[RealtimeInterview] ⚠️ Response exceeded trim threshold, sending cancel...');
            if (realtimeHandlesRef.current?.dataChannel) {
              realtimeHandlesRef.current.dataChannel.send(JSON.stringify({
                type: 'response.cancel'
              }));
              cancelSentRef.current = true;
            }
          }
        },

        onAssistantTextDone: () => {
          const rawResponse = assistantResponseRef.current;
          console.log('[RealtimeInterview] Assistant response complete (raw):', rawResponse);

          // Step 1: Enforce scope (catches off-topic, enforces structure)
          const scopeEnforced = enforceScope(rawResponse);
          if (scopeEnforced !== rawResponse) {
            console.log('[RealtimeInterview] 🛡️ Scope enforcer modified response:', scopeEnforced);
          }

          // Step 2: Sanitize for PEARLS v1.1 compliance
          const result = sanitizeResponse(scopeEnforced);
          if (!result.isValid) {
            console.warn('[RealtimeInterview] ⚠️ Sanitization violations:', result.violations);
            // Log violations but don't block (audio already played)
            // In future, could send feedback to improve model behavior
          }

          // Use the scope-enforced response (final processed version)
          const finalResponse = scopeEnforced;

          // Check if we're waiting for user transcript
          if (waitingForUserTranscriptRef.current) {
            console.log('[RealtimeInterview] Buffering Pearl response until user transcript arrives');
            pendingAssistantResponseRef.current = finalResponse;
          } else {
            // Send complete response to caller immediately (for display in chat)
            if (finalResponse && onAssistantResponse) {
              // No artificial delay here - delay is applied when flushing buffered response
              onAssistantResponse(finalResponse);
            }
          }

          // Reset for next response
          assistantResponseRef.current = '';
          cancelSentRef.current = false; // Reset cancel flag for next response
        },

        // Barge-in: Pause audio when user speaks
        onSpeechStarted: () => {
          console.log('[RealtimeInterview] User speech started - pausing assistant');
          if (audioElementRef.current && !audioElementRef.current.paused) {
            audioElementRef.current.pause();
            console.log('[RealtimeInterview] Audio paused for barge-in');
          }
        },

        // User stopped speaking - set buffering flag for message ordering
        onSpeechStopped: () => {
          console.log('[RealtimeInterview] User stopped speaking - expecting transcript soon');
          waitingForUserTranscriptRef.current = true;

          // Resume audio playback after user stops speaking
          if (audioElementRef.current && audioElementRef.current.paused && voiceEnabled) {
            audioElementRef.current.play().then(() => {
              console.log('[RealtimeInterview] 🔊 Audio resumed after user stopped speaking');
            }).catch(err => {
              console.error('[RealtimeInterview] Failed to resume audio:', err);
            });
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

    // Stop audio playback and remove from DOM
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
      // Remove from DOM if it was added
      if (audioElementRef.current.parentNode) {
        audioElementRef.current.parentNode.removeChild(audioElementRef.current);
      }
      audioElementRef.current = null;
    }

    // Stop Realtime connection
    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.stop();
      realtimeHandlesRef.current = null;
    }

    setStatus('disconnected');
    setProvisionalTranscript('');
    assistantResponseRef.current = ''; // Reset accumulated response
  }, []);

  // Toggle voice output
  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const newValue = !prev;

      // Mute/unmute the audio element
      if (audioElementRef.current) {
        audioElementRef.current.muted = !newValue;
        console.log('[RealtimeInterview] Pearl voice', newValue ? 'ENABLED' : 'MUTED');
      }

      return newValue;
    });
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

  // Update instructions dynamically (session.update)
  const updateInstructions = useCallback((instructions: string) => {
    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.updateInstructions(instructions);
    } else {
      console.warn('[RealtimeInterview] Cannot update instructions - no active session');
    }
  }, []);

  // Send text message to conversation
  const sendTextMessage = useCallback((text: string) => {
    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.sendTextMessage(text);
    } else {
      console.warn('[RealtimeInterview] Cannot send text message - no active session');
    }
  }, []);

  // Trigger Pearl to speak first (without user message)
  const triggerPearlResponse = useCallback(() => {
    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.triggerPearlResponse();
    } else {
      console.warn('[RealtimeInterview] Cannot trigger Pearl response - no active session');
    }
  }, []);

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
    updateInstructions,
    sendTextMessage,
    triggerPearlResponse,
  };
}
