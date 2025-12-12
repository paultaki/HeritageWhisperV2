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
import { supabase } from '@/lib/supabase';
// NOTE: Post-processing disabled for Realtime API to prevent audio/text mismatch
// import { sanitizeResponse } from '@/lib/responseSanitizer';
// import { enforceScope } from '@/lib/scopeEnforcer';

/**
 * Fetch ephemeral token from server-side proxy
 * SECURITY: Never expose OPENAI_API_KEY to browser
 * Token expires in ~60 seconds, so fetch immediately before WebRTC connection
 */
async function fetchEphemeralToken(): Promise<string> {
  console.log('[RealtimeInterview] 🔑 Fetching ephemeral token...');

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.error('[RealtimeInterview] ❌ No auth token available');
    throw new Error('Not authenticated - please sign in to use Pearl');
  }

  console.log('[RealtimeInterview] 📤 Calling /api/realtime-session...');
  const response = await fetch('/api/realtime-session', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('[RealtimeInterview] ❌ Token fetch failed:', response.status, errorData);
    throw new Error(errorData.error || `Failed to get session token (${response.status})`);
  }

  const data = await response.json();
  console.log('[RealtimeInterview] ✅ Got response from /api/realtime-session:', {
    hasClientSecret: !!data.client_secret,
    expiresAt: data.expires_at,
  });

  if (!data.client_secret) {
    console.error('[RealtimeInterview] ❌ No client_secret in response');
    throw new Error('No client secret received from server');
  }

  return data.client_secret;
}

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// "Grandchild" Persona - Curious, loving, and eager to learn
// Designed to make seniors feel like they are sharing wisdom with a younger generation
// Research-backed: Uses Smithsonian Oral History + Reminiscence Therapy techniques
export const GRANDCHILD_INSTRUCTIONS = `You are a curious, loving, and patient grandchild interviewing your grandparent (or elder relative) for HeritageWhisper.

CRITICAL: You MUST speak ONLY in English. Never speak Spanish or any other language.

YOUR PERSONA:
- Name: You don't need to say your name, just act like their loving grandchild.
- Tone: Warm, enthusiastic, respectful, and genuinely curious.
- Voice: You are talking to your grandparent. Be gentle but engaged.

YOUR GOAL:
- Help them tell RICH, VIVID stories full of sensory details and emotion.
- Make them feel listened to and valued.
- Go DEEP on each topic before moving to new ones.

=== SESSION START ===
When the conversation FIRST begins (your very first response), warmly greet them:
"Hi! I'm so excited to hear your stories today. Just speak naturally - there's no rush, and I'm here to listen. Whenever you're ready!"

Do NOT repeat this greeting later in the conversation.

=== SENSORY PROBING TECHNIQUES (Use these!) ===
When they mention a memory, help them "place themselves there" with these probes:

PLACE: "Picture yourself there. What do you see around you?"
SENSES: "What did it smell like? Sound like? Feel like?"
PEOPLE: "Who else was there? What were they wearing or doing?"
TIME: "What time of year was this? How old were you?"
OBJECTS: "What were you holding? What was in the room?"

Example:
User: "I remember my grandmother's kitchen."
You: "Oh, her kitchen! Close your eyes for a moment - what's the first thing you smell when you walk in?"
User: "Cinnamon. She was always baking."
You: "Cinnamon! Was there a favorite thing she baked? What did it look like coming out of the oven?"

=== 3-LAYER DEPTH STRATEGY ===
Stay on the SAME topic until you've explored all three layers:

Layer 1 (FACTS): "What happened next?" / "Then what?"
Layer 2 (FEELINGS): "How did that make you feel in that moment?"
Layer 3 (MEANING): "Looking back now, why do you think that mattered?"

ONLY move to a new topic after exploring all three layers, or if they signal they want to move on.

=== HANDLING DIFFICULTIES ===
- If they seem confused: "No worries! Let me ask that a different way..."
- If they go off-topic: Gently acknowledge, then guide back: "That's interesting! I'd also love to hear more about [original topic]..."
- If they give very short answers: Encourage with sensory questions: "Tell me more - what did it look like? Sound like?"
- If there's silence: Be patient. Say: "Take your time... I'm right here."

=== HOW TO SPEAK ===
- Use simple, natural language. Don't sound like a robot or a professor.
- Say things like: "Wow!", "Really?", "That's amazing!", "I never knew that!"
- If they mention a specific person or place, ask about it: "Who was that?", "What did it look like?"
- If they pause, give them time. Say: "Take your time... I'm right here."
- If they get emotional, be supportive: "It's okay to feel that way. I'm here listening."
- Acknowledge what they said before asking the next question.

=== KEY RULES ===
- Ask ONE question at a time.
- Keep your responses short (1-2 sentences max) so they can talk more.
- NEVER make up facts. If you don't know something, ask them!
- If they ask for advice, say: "I'm not sure, but I'd love to hear what you think."
- If their answer is short or surface-level, gently probe for more detail using sensory questions.

=== ENDING THE SESSION ===
If they say they're done or want to stop:
- Summarize one highlight: "I loved hearing about [specific detail they shared]!"
- Express gratitude: "Thank you so much for sharing these precious memories with me."
- Keep it brief - they've already said they want to stop.

=== EXAMPLE INTERACTION ===
User: "I grew up on a farm."
You: "Wow, a farm! Picture the farmhouse for me - what's the first thing you see when you walk up to it?"
User: "A big white porch with a swing."
You: "A porch swing! Who used to sit there with you? What would you talk about?"
User: "My grandfather. We'd watch the sunset."
You: "That sounds peaceful. How did those moments with your grandfather make you feel?"
User: "Safe. Like everything would be okay."
You: "What a beautiful feeling. Looking back, why do you think those porch swing moments mattered so much?"
`;

// Legacy export for backwards compatibility
export const PEARL_INSTRUCTIONS = GRANDCHILD_INSTRUCTIONS;

export type ConversationPhase = 'idle' | 'listening' | 'thinking' | 'speaking';

export function useRealtimeInterview() {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>('idle');
  const [provisionalTranscript, setProvisionalTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Enable voice by default for V2
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0); // Track duration internally
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const pearlAudioRecorderRef = useRef<MediaRecorder | null>(null); // Record Pearl's audio for transcription
  const pearlAudioChunksRef = useRef<Blob[]>([]); // Chunks of Pearl's audio
  const pearlAudioStreamRef = useRef<MediaStream | null>(null); // Store Pearl's audio stream for creating new recorders
  const onAssistantResponseCallbackRef = useRef<((text: string) => void) | null>(null); // Store callback for Pearl's final transcribed text
  const onAssistantTextDeltaCallbackRef = useRef<((delta: string) => void) | null>(null); // Store callback for Pearl's text deltas (real-time streaming)
  const lastChunkTimeRef = useRef<number>(0); // Track when last audio chunk was received

  // Start Realtime session
  const startSession = useCallback(async (
    onTranscriptFinal: (text: string) => void,
    onError?: (error: Error) => void,
    config?: RealtimeConfig,
    onAssistantResponse?: (text: string) => void,
    onUserSpeechStart?: () => void,  // Callback when user starts speaking
    userName?: string, // Optional user name for personalization
    onAssistantTextDelta?: (delta: string) => void // Callback for real-time text streaming
  ) => {
    console.log('[RealtimeInterview] 🚀 startSession called');
    try {
      setStatus('connecting');
      setError(null);
      startTimeRef.current = Date.now();
      setRecordingDuration(0);

      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Fetch ephemeral token from server-side proxy
      // Token expires in ~60 seconds, so fetch immediately before connection
      console.log('[RealtimeInterview] 📡 Fetching ephemeral token...');
      const ephemeralToken = await fetchEphemeralToken();
      console.log('[RealtimeInterview] ✅ Got ephemeral token, starting WebRTC...');

      // Store callbacks for later use
      onAssistantResponseCallbackRef.current = onAssistantResponse || null;
      onAssistantTextDeltaCallbackRef.current = onAssistantTextDelta || null;

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

        // Pearl response started - start recording her audio for transcription
        onAssistantResponseCreated: () => {
          console.log('[RealtimeInterview] 🎙️ Pearl started speaking, creating new recorder...');
          pearlAudioChunksRef.current = [];

          // Signal to UI that Pearl started composing (show typing indicator / create empty bubble)
          if (onAssistantTextDeltaCallbackRef.current) {
            onAssistantTextDeltaCallbackRef.current('__PEARL_START__');
          }

          // Stop previous recorder if it exists
          if (pearlAudioRecorderRef.current && pearlAudioRecorderRef.current.state !== 'inactive') {
            pearlAudioRecorderRef.current.stop();
          }

          // Create a new MediaRecorder for this response
          if (pearlAudioStreamRef.current) {
            try {
              const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

              const recorder = new MediaRecorder(pearlAudioStreamRef.current, { mimeType });

              recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                  pearlAudioChunksRef.current.push(event.data);
                  lastChunkTimeRef.current = Date.now(); // Track when last chunk arrived
                  console.log('[RealtimeInterview] Pearl chunk received:', event.data.size, 'bytes');
                }
              };

              recorder.onstop = () => {
                console.log('[RealtimeInterview] Pearl recorder stopped, chunks:', pearlAudioChunksRef.current.length);
              };

              recorder.start(100); // Collect data every 100ms
              pearlAudioRecorderRef.current = recorder;
              console.log('[RealtimeInterview] ✅ New MediaRecorder created and started');
            } catch (error) {
              console.error('[RealtimeInterview] Failed to create MediaRecorder:', error);
            }
          } else {
            console.warn('[RealtimeInterview] ⚠️ No Pearl audio stream available yet');
          }
        },

        // Pearl response complete - finalize audio recording (text already streamed)
        onAssistantResponseComplete: async () => {
          console.log('[RealtimeInterview] ✅ Pearl finished generating response (text already streamed)');

          // Stop recording to get a complete WebM file (for saving/playback, not for transcription)
          if (pearlAudioRecorderRef.current && pearlAudioRecorderRef.current.state === 'recording') {
            pearlAudioRecorderRef.current.stop();
            console.log('[RealtimeInterview] Stopped Pearl audio recorder');
          }

          // Short flush delay to ensure final chunks are collected
          await new Promise(resolve => setTimeout(resolve, 200));

          console.log('[RealtimeInterview] Audio chunks collected:', pearlAudioChunksRef.current.length, 'chunks for saving/playback');

          // NOTE: We do NOT transcribe Pearl's audio here anymore
          // The transcript was already streamed in real-time via onAssistantTextDelta
          // Audio is kept for saving/playback purposes only

          // Fallback: If no text deltas were received (shouldn't happen), use Whisper as backup
          if (assistantResponseRef.current.trim().length === 0 && pearlAudioChunksRef.current.length > 0) {
            console.warn('[RealtimeInterview] ⚠️ No text deltas received, falling back to Whisper transcription');
            try {
              const audioBlob = new Blob(pearlAudioChunksRef.current, { type: 'audio/webm' });
              const formData = new FormData();
              formData.append('audio', audioBlob, 'pearl.webm');

              const { data: { session } } = await supabase.auth.getSession();
              const response = await fetch('/api/interview-test/transcribe-chunk', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session?.access_token}`,
                },
                body: formData,
              });

              if (response.ok) {
                const data = await response.json();
                const transcribedText = data.transcription;
                console.log('[RealtimeInterview] Fallback Whisper transcription:', transcribedText);

                // Send transcribed text to callback as fallback
                if (onAssistantResponseCallbackRef.current) {
                  onAssistantResponseCallbackRef.current(transcribedText);
                }
              }
            } catch (error) {
              console.error('[RealtimeInterview] Fallback Whisper transcription failed:', error);
            }
          }

          // Reset for next response
          pearlAudioChunksRef.current = [];
        },

        // Assistant audio output (voice mode + mixed recording)
        onAssistantAudio: (stream) => {
          // Store Pearl's audio stream for creating recorders per response
          pearlAudioStreamRef.current = stream;

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
          setConversationPhase('speaking');
          if (onAssistantResponse) {
            onAssistantResponse('__COMPOSING__');
          }
        },

        // Assistant text streaming - forward deltas to UI for real-time transcript
        onAssistantTextDelta: (text) => {
          assistantResponseRef.current += text;

          // Forward text delta to UI for real-time streaming
          if (onAssistantTextDeltaCallbackRef.current) {
            onAssistantTextDeltaCallbackRef.current(text);
          }

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

          // Pearl finished speaking, now listening for user
          setConversationPhase('listening');
        },

        // Barge-in: DISABLED - Pearl will not be interrupted while speaking
        // User speech is still transcribed and processed after Pearl finishes
        onSpeechStarted: () => {
          if (!micEnabledRef.current) {
            return;
          }

          // User started speaking
          setConversationPhase('listening');

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

          // User stopped speaking, now processing/thinking
          setConversationPhase('thinking');

          // NO NEED TO RESUME AUDIO: Since barge-in is disabled, audio was never paused
          // The user's speech will be transcribed and processed after Pearl finishes speaking
        },

        // Connection established
        onConnected: () => {
          setStatus('connected');
          setConversationPhase('speaking'); // Pearl will speak first

          // Trigger Pearl to speak her greeting after a short delay
          // This gives the WebRTC connection time to fully stabilize
          setTimeout(() => {
            console.log('[RealtimeInterview] 🎤 Triggering Pearl to speak first...');
            handles.triggerPearlResponse();
          }, 500);
        },

        // Error handling
        onError: (err) => {
          console.error('[RealtimeInterview] Error:', err);
          setError(err.message);
          setStatus('error');
          onError?.(err);
        },
      },
        // Ephemeral token from server-side proxy (60-second TTL)
        // SECURITY: API key never exposed to browser
        ephemeralToken,
        {
          ...config,
          instructions: config?.instructions
            ? config.instructions.replace('{{userName}}', userName || 'Grandma/Grandpa')
            : GRANDCHILD_INSTRUCTIONS.replace('{{userName}}', userName || 'Grandma/Grandpa'),
        }
      );

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

    // Stop Pearl audio recorder (for transcription)
    if (pearlAudioRecorderRef.current) {
      if (pearlAudioRecorderRef.current.state !== 'inactive') {
        pearlAudioRecorderRef.current.stop();
      }
      pearlAudioRecorderRef.current = null;
    }
    pearlAudioChunksRef.current = [];

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
    setConversationPhase('idle');
    setProvisionalTranscript('');
    assistantResponseRef.current = ''; // Reset accumulated response

    // Stop duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // Toggle voice output
  // If `enabled` is provided, set to that value; otherwise toggle
  const toggleVoice = useCallback((enabled?: boolean) => {
    setVoiceEnabled(prev => {
      const newValue = enabled !== undefined ? enabled : !prev;

      // Mute/unmute the audio element
      if (audioElementRef.current) {
        audioElementRef.current.muted = !newValue;
        // Pause when disabling voice
        if (!newValue && !audioElementRef.current.paused) {
          audioElementRef.current.pause();
        }
        // Resume when enabling voice (if Pearl is speaking)
        if (newValue && audioElementRef.current.paused && audioElementRef.current.srcObject) {
          audioElementRef.current.play().catch(err => {
            console.warn('[RealtimeInterview] Failed to resume audio on voice enable:', err);
          });
        }
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
    conversationPhase,
    provisionalTranscript,
    voiceEnabled,
    error,
    startSession,
    stopSession,
    toggleVoice,
    toggleMic,
    startMixedRecording,
    getMixedAudioBlob,
    getUserAudioBlob: getUserOnlyAudioBlob, // Alias for consistency
    getMicStream,
    updateInstructions,
    sendTextMessage,
    triggerPearlResponse,
    recordingDuration,
    // These are managed internally by the hook now, but exposed for flexibility if needed
    handleTranscriptUpdate: (text: string, isFinal: boolean) => { }, // No-op as hook handles it
    handleAudioResponse: (blob: Blob, duration: number) => { }, // No-op
  };
}
