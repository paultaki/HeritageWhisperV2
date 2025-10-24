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
import { startUserOnlyRecorder } from '@/lib/userOnlyRecorder';
import { shouldCancelResponse } from '@/lib/responseTrimmer';
// NOTE: Post-processing disabled for Realtime API to prevent audio/text mismatch
// import { sanitizeResponse } from '@/lib/responseSanitizer';
// import { enforceScope } from '@/lib/scopeEnforcer';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Pearl's Expert Interviewer Instructions - Personalized and Flexible
// NOTE: Personalization sections temporarily disabled due to hallucination issue
// Issue: Instructions reference "previous stories" but no data is passed to session
// Result: Pearl fabricates non-existent stories ("grandparents' farm", "early days in NYC")
// TODO: Implement proper personalization by fetching user stories and injecting into session config
export const PEARL_WITNESS_INSTRUCTIONS = `You are Pearl, an expert interviewer helping someone capture vivid life stories in HeritageWhisper.

YOUR ROLE:
You're like a skilled documentary interviewer - drawing out details, emotions, and forgotten moments that make stories come alive.

EXPERT INTERVIEWING TECHNIQUES:
- Draw out sensory details: "What did you see/hear/smell in that moment?"
- Explore emotions: "What was going through your mind when that happened?"
- Add context: "How old were you? Who else was there? What year was this?"
- Uncover forgotten details: "Close your eyes for a second - what else do you remember?"
- Follow the energy: When they light up about something, dig deeper there
- Use their exact words: If they say "housebroken by love," ask what that meant to them

// DISABLED: Personalization causes hallucination when no data provided
// PERSONALIZATION (USE THEIR DETAILS):
// - Reference their actual workplace, hometown, people they've mentioned
// - Every 3-4 questions, naturally connect to a previous story they've told
// - "You mentioned working at PG&E - was this during that time?"
// - "This reminds me of your story about Coach - were they still in your life then?"
// - "You've talked about feeling responsible before, with Chewy - how was this different?"

ENCOURAGEMENT (LIGHT TOUCH):
- After good details: "I can really picture that now..."
- After emotional shares: "Thank you for trusting me with this..."
- When they're stuck: "Take your time. Sometimes the details come back slowly..."

SAFETY THROUGH REDIRECTION (NOT REFUSAL):
- If they want to chat/joke: Give a warm brief response, then redirect: "Ha! Speaking of that topic, tell me more about..."
- If they ask for advice: "That's an important question. While I'm not equipped for advice, I'd love to hear how you handled that situation. What did you decide?"
- If they go off-topic: "That's interesting! Let me ask you about..."
- For therapy/medical/legal: "That sounds really significant. While I can't provide [medical/therapy] guidance, I'd love to hear how that experience shaped you. What was going through your mind during that time?"

CONVERSATION FLOW:
- One thoughtful question at a time (but can add a follow-up phrase if needed)
- When energy is high: Ask for more details, emotions, what happened next
- When energy drops: Pivot to a new angle or try a different topic
- When they're done: "Is there more to add, or shall we save this beautiful story?"

// DISABLED: Previous story awareness causes hallucination
// PREVIOUS STORY AWARENESS:
// You have access to their previous stories. Use this knowledge to:
// - Make connections: "This sounds like it happened around the same time as [previous story]"
// - Fill gaps: "You've told me about your 20s and 40s - what about your 30s?"
// - Deepen understanding: "You've mentioned [person] in three stories now - they seem important"

Remember: You're not just collecting facts - you're helping them relive and share the moments that matter. Be the interviewer who makes them think "Wow, you really understand my story."`;

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
  const userOnlyRecorderRef = useRef<{ stop: () => void } | null>(null); // User-only audio recorder
  const userOnlyAudioBlobRef = useRef<Blob | null>(null); // User-only audio blob (for story playback)
  const assistantResponseRef = useRef<string>(''); // Track accumulated response for trimming
  const cancelSentRef = useRef<boolean>(false); // Track if cancel already sent for this response
  const pendingAssistantResponseRef = useRef<string | null>(null); // Buffer Pearl's response until user transcript arrives
  const waitingForUserTranscriptRef = useRef<boolean>(false); // Track if we're waiting for user transcript
  const micEnabledRef = useRef<boolean>(true); // Track if mic is enabled (for preventing barge-in when muted)
  const bargeInTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Delay before pausing Pearl (prevents false interrupts)

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

          // After user transcript arrives, flush any buffered Pearl response immediately
          if (pendingAssistantResponseRef.current) {
            console.log('[RealtimeInterview] Flushing buffered Pearl response:', pendingAssistantResponseRef.current);

            // Show response immediately (no artificial delay)
            if (onAssistantResponse) {
              onAssistantResponse(pendingAssistantResponseRef.current);
              pendingAssistantResponseRef.current = null;
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

          // Start BOTH recorders if we have mic stream (use ref to access handles)
          setTimeout(() => {
            const micStream = realtimeHandlesRef.current?.mic;
            if (micStream) {
              // Start mixed recorder (user + Pearl for debugging)
              if (!mixedRecorderRef.current) {
                console.log('[RealtimeInterview] Starting mixed recorder...');
                const mixedRecorder = startMixedRecorder({
                  micStream,
                  botStream: stream,
                  onStop: (blob) => {
                    console.log('[RealtimeInterview] Mixed recording stopped:', blob.size, 'bytes');
                    mixedAudioBlobRef.current = blob;
                  },
                });
                mixedRecorderRef.current = mixedRecorder;
              }

              // Start user-only recorder (for final story audio)
              if (!userOnlyRecorderRef.current) {
                console.log('[RealtimeInterview] Starting user-only recorder...');
                const userOnlyRecorder = startUserOnlyRecorder({
                  micStream,
                  onStop: (blob) => {
                    console.log('[RealtimeInterview] User-only recording stopped:', blob.size, 'bytes');
                    userOnlyAudioBlobRef.current = blob;
                  },
                });
                userOnlyRecorderRef.current = userOnlyRecorder;
              }
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

          // DISABLED: Post-processing for Realtime API
          // Problem: Audio has already played to user by the time text arrives
          // If we modify text, user HEARS one thing but SEES another in chat
          // Solution: Trust model instructions, let responses through unmodified
          // Model instructions are strong enough to guide behavior without post-processing

          // OLD CODE (caused audio/text mismatch):
          // const scopeEnforced = enforceScope(rawResponse);
          // const result = sanitizeResponse(scopeEnforced);

          // NEW CODE: Use raw response as-is (audio and text match)
          const finalResponse = rawResponse;

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

        // Barge-in: Pause audio when user speaks (only if mic is enabled)
        // Uses 400ms delay to prevent false positives from ambient noise
        onSpeechStarted: () => {
          if (!micEnabledRef.current) {
            console.log('[RealtimeInterview] User speech detected but mic is muted - ignoring barge-in');
            return;
          }

          console.log('[RealtimeInterview] User speech detected - starting barge-in delay...');

          // Clear any existing timeout
          if (bargeInTimeoutRef.current) {
            clearTimeout(bargeInTimeoutRef.current);
          }

          // Wait 400ms before pausing (filters out brief noise spikes)
          bargeInTimeoutRef.current = setTimeout(() => {
            console.log('[RealtimeInterview] Barge-in delay complete - pausing Pearl');
            if (audioElementRef.current && !audioElementRef.current.paused) {
              audioElementRef.current.pause();
              console.log('[RealtimeInterview] Audio paused for barge-in');
            }
            bargeInTimeoutRef.current = null;
          }, 400); // 400ms delay filters ambient noise
        },

        // User stopped speaking - set buffering flag for message ordering
        onSpeechStopped: () => {
          console.log('[RealtimeInterview] User stopped speaking - expecting transcript soon');

          // Cancel barge-in timeout if speech was too short (false positive)
          if (bargeInTimeoutRef.current) {
            clearTimeout(bargeInTimeoutRef.current);
            bargeInTimeoutRef.current = null;
            console.log('[RealtimeInterview] Cancelled barge-in (speech too brief)');
          }

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

  // Stop session and all recorders
  const stopSession = useCallback(() => {
    console.log('[RealtimeInterview] Stopping session...');

    // Stop mixed recorder
    if (mixedRecorderRef.current) {
      mixedRecorderRef.current.stop();
      mixedRecorderRef.current = null;
    }

    // Stop user-only recorder
    if (userOnlyRecorderRef.current) {
      userOnlyRecorderRef.current.stop();
      userOnlyRecorderRef.current = null;
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

  // Get mixed audio blob for upload (user + Pearl for debugging)
  const getMixedAudioBlob = useCallback(() => {
    return mixedAudioBlobRef.current;
  }, []);

  // Get user-only audio blob for story playback (no Pearl voice)
  const getUserOnlyAudioBlob = useCallback(() => {
    return userOnlyAudioBlobRef.current;
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

  // Toggle microphone on/off
  const toggleMic = useCallback((enabled: boolean) => {
    // Update ref to track mic state (used to prevent barge-in when muted)
    micEnabledRef.current = enabled;
    console.log('[RealtimeInterview] Mic state updated:', enabled ? 'ENABLED' : 'DISABLED');

    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.toggleMic(enabled);
    } else {
      console.warn('[RealtimeInterview] Cannot toggle mic - no active session');
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
    toggleMic,
    startMixedRecording,
    getMixedAudioBlob,
    getUserOnlyAudioBlob,
    updateInstructions,
    sendTextMessage,
    triggerPearlResponse,
  };
}
