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
    onAssistantResponse?: (text: string) => void,
    onUserSpeechStart?: () => void  // Callback when user starts speaking
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
          setProvisionalTranscript(''); // Clear provisional
          onTranscriptFinal(text);

          // After user transcript arrives, flush any buffered Pearl response immediately
          if (pendingAssistantResponseRef.current) {
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
            // Only create audio element ONCE per session (not per response)
            if (!audioElementRef.current) {
              // Create and configure audio element
              const audio = document.createElement('audio');
              audio.autoplay = true;
              audio.muted = false; // Audio plays immediately as Pearl speaks
              audio.volume = 1.0;
              audio.srcObject = stream;

              // Add to DOM (hidden) - required for audio playback in some browsers
              audio.style.display = 'none';
              audio.id = 'pearl-audio-element';
              document.body.appendChild(audio);

              // Add event listeners for debugging
              audio.addEventListener('error', (e) => {
                console.error('[RealtimeInterview] ❌ Audio ERROR:', e);
              });

              // Check if setSinkId is available (Chrome/Edge only)
              if ('setSinkId' in audio) {
                navigator.mediaDevices.enumerateDevices().then(devices => {
                  const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

                  // Try to set default audio output
                  if (audioOutputs.length > 0) {
                    (audio as any).setSinkId('').then(() => {
                      // Audio output set to default device
                    }).catch((err: any) => {
                      console.error('[RealtimeInterview] Failed to set audio output:', err);
                    });
                  }
                });
              }

              // Explicitly call play() - autoplay might be blocked by browser
              audio.play().then(() => {
                // Audio playback started successfully
              }).catch(err => {
                console.error('[RealtimeInterview] ❌ Audio play failed:', err);
                console.error('[RealtimeInterview] This is usually due to browser autoplay policy');
                console.error('[RealtimeInterview] User must interact with page first (click button, etc.)');
                console.error('[RealtimeInterview] Stream tracks:', stream.getTracks());
              });
              audioElementRef.current = audio;
            } else {
              // Make sure it's not paused and stream is still connected
              if (audioElementRef.current.paused) {
                audioElementRef.current.play().catch(err => {
                  console.error('[RealtimeInterview] Failed to resume audio:', err);
                });
              }
            }
          }

          // Start BOTH recorders if we have mic stream (use ref to access handles)
          setTimeout(() => {
            const micStream = realtimeHandlesRef.current?.mic;
            if (micStream) {
              // Start mixed recorder (user + Pearl for debugging)
              if (!mixedRecorderRef.current) {
                const mixedRecorder = startMixedRecorder({
                  micStream,
                  botStream: stream,
                  onStop: (blob) => {
                    mixedAudioBlobRef.current = blob;
                  },
                });
                mixedRecorderRef.current = mixedRecorder;
              }

              // Start user-only recorder (for final story audio)
              if (!userOnlyRecorderRef.current) {
                const userOnlyRecorder = startUserOnlyRecorder({
                  micStream,
                  onStop: (blob) => {
                    userOnlyAudioBlobRef.current = blob;
                  },
                });
                userOnlyRecorderRef.current = userOnlyRecorder;
              }
            }
          }, 100);
        },

        // Assistant response started (first text delta) - show typing indicator
        onAssistantResponseStarted: () => {
          if (onAssistantResponse) {
            onAssistantResponse('__COMPOSING__');
          }
        },

        // Assistant text streaming (for response trimming)
        onAssistantTextDelta: (text) => {
          assistantResponseRef.current += text;

          // DISABLED: Response trimmer was causing Pearl to be cut off mid-question
          // The shouldCancelResponse logic was too aggressive, canceling valid multi-sentence responses
          // Now relying on max_response_output_tokens (1200) to limit response length instead
          /*
          if (!cancelSentRef.current && shouldCancelResponse(assistantResponseRef.current)) {
            if (realtimeHandlesRef.current?.dataChannel) {
              realtimeHandlesRef.current.dataChannel.send(JSON.stringify({
                type: 'response.cancel'
              }));
              cancelSentRef.current = true;
            }
          }
          */
        },

        onAssistantTextDone: () => {
          const rawResponse = assistantResponseRef.current;

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

        // Barge-in: DISABLED - Pearl will not be interrupted while speaking
        // User speech is still transcribed and processed after Pearl finishes
        onSpeechStarted: () => {
          if (!micEnabledRef.current) {
            return;
          }

          // Notify page to show waveform
          if (onUserSpeechStart) {
            onUserSpeechStart();
          }

          // BARGE-IN DISABLED: The following code would pause Pearl's audio when user speaks
          // Left commented for future reference if this behavior needs to be re-enabled

          // // Clear any existing timeout
          // if (bargeInTimeoutRef.current) {
          //   clearTimeout(bargeInTimeoutRef.current);
          // }

          // // Wait 400ms before pausing (filters out brief noise spikes)
          // bargeInTimeoutRef.current = setTimeout(() => {
          //   if (audioElementRef.current && !audioElementRef.current.paused) {
          //     audioElementRef.current.pause();
          //   }
          //   bargeInTimeoutRef.current = null;
          // }, 400);
        },

        // User stopped speaking - set buffering flag for message ordering
        onSpeechStopped: () => {
          // Cancel barge-in timeout if it exists (though it shouldn't be set anymore)
          if (bargeInTimeoutRef.current) {
            clearTimeout(bargeInTimeoutRef.current);
            bargeInTimeoutRef.current = null;
          }

          waitingForUserTranscriptRef.current = true;

          // NO NEED TO RESUME AUDIO: Since barge-in is disabled, audio was never paused
          // The user's speech will be transcribed and processed after Pearl finishes speaking
        },

        // Connection established
        onConnected: () => {
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

    const recorder = startMixedRecorder({
      micStream,
      botStream: assistantStream,
      onStop: (blob) => {
        mixedAudioBlobRef.current = blob;
      },
    });

    mixedRecorderRef.current = recorder;
  }, []);

  // Stop session and all recorders
  const stopSession = useCallback(() => {
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

    if (realtimeHandlesRef.current) {
      realtimeHandlesRef.current.toggleMic(enabled);
    } else {
      console.warn('[RealtimeInterview] Cannot toggle mic - no active session');
    }
  }, []);

  // Get the active microphone stream for waveform visualization
  const getMicStream = useCallback(() => {
    return realtimeHandlesRef.current?.mic || null;
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
    getMicStream,
    updateInstructions,
    sendTextMessage,
    triggerPearlResponse,
  };
}
