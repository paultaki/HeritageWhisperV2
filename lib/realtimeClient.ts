/**
 * OpenAI Realtime API Client (WebRTC)
 *
 * Docs: https://platform.openai.com/docs/guides/realtime-webrtc
 *
 * Key Details:
 * - Transport: WebRTC (browser → OpenAI) - NOT WebSocket
 * - Audio: 48kHz Opus (WebRTC negotiates automatically)
 * - Session Config: Send session.update after connection
 * - Barge-in: Server VAD + client-side audio pause
 */

export type RealtimeHandles = {
  pc: RTCPeerConnection;
  mic: MediaStream;
  dataChannel: RTCDataChannel;
  stop: () => void;
  reconnect: () => Promise<RealtimeHandles>;
  updateInstructions: (instructions: string) => void;
  sendTextMessage: (text: string) => void;
  triggerPearlResponse: () => void;
  toggleMic: (enabled: boolean) => void;
};

export type RealtimeCallbacks = {
  onTranscriptDelta: (text: string) => void;
  onTranscriptFinal: (text: string) => void;
  onAssistantAudio: (stream: MediaStream) => void;
  onAssistantTextDelta?: (text: string) => void;
  onAssistantTextDone?: () => void;
  onAssistantResponseStarted?: () => void;  // When first text delta arrives
  onAssistantResponseCreated?: () => void;  // When response.created arrives (Pearl starts)
  onAssistantResponseComplete?: () => void;  // When response.done arrives (Pearl finishes)
  onSpeechStarted?: () => void;  // For barge-in
  onSpeechStopped?: () => void;
  onError: (error: Error) => void;
  onConnected?: () => void;
};

export type RealtimeConfig = {
  instructions?: string;
  modalities?: ('text' | 'audio')[];
  voice?: 'alloy' | 'echo' | 'shimmer';
  temperature?: number;
};

export async function startRealtime(
  callbacks: RealtimeCallbacks,
  apiKey: string,
  config?: RealtimeConfig
): Promise<RealtimeHandles> {
  console.log('[Realtime] 🚀 startRealtime called, apiKey length:', apiKey?.length || 0);

  // 2. Create WebRTC peer connection
  // Docs: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
  const pc = new RTCPeerConnection();
  console.log('[Realtime] ✅ RTCPeerConnection created');

  // 3. Assistant audio output (receive track)
  pc.ontrack = (event) => {
    const stream = event.streams[0];
    callbacks.onAssistantAudio(stream);
  };

  // 4. Data channel for events (transcripts, text, etc.)
  const dataChannel = pc.createDataChannel('oai-events');

  // Track if we've seen the first text delta for this response
  let hasSeenFirstDelta = false;

  dataChannel.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      // DEBUG: Log all events to diagnose response generation
      const importantEvents = [
        'session.created', 'session.updated',
        'input_audio_buffer.speech_started', 'input_audio_buffer.speech_stopped',
        'input_audio_buffer.committed',
        'response.created', 'response.done',
        'conversation.item.created',
        'error'
      ];
      if (importantEvents.includes(msg.type)) {
        console.log('[Realtime] 📨 Event:', msg.type, msg.type === 'error' ? msg.error : '');
      }

      // User speech transcript events (CANONICAL NAMES)
      if (msg.type === 'conversation.item.input_audio_transcription.delta') {
        callbacks.onTranscriptDelta(msg.delta || '');
      }
      if (msg.type === 'conversation.item.input_audio_transcription.completed') {
        console.log('[Realtime] 📝 User transcript completed:', msg.transcript?.substring(0, 50) + '...');
        callbacks.onTranscriptFinal(msg.transcript || '');
      }
      if (msg.type === 'conversation.item.input_audio_transcription.failed') {
        console.error('[Realtime] ❌ Transcription failed:', msg.error);
        callbacks.onError(new Error('Transcription failed: ' + msg.error?.message));
      }

      // conversation.item.created - user audio committed
      if (msg.type === 'conversation.item.created') {
        // Check if this is a user audio item that needs transcription
        if (msg.item?.type === 'message' && msg.item?.role === 'user') {
          console.log('[Realtime] 👤 User message committed to conversation');
        }
      }

      // Assistant text streaming (handle ALL variants)
      // Different event types for text depending on modality:
      // - response.text.delta / response.text.done (text-only mode)
      // - response.output_text.delta / response.output_text.done (some SDKs)
      // - response.audio_transcript.delta / response.audio_transcript.done (audio mode with transcription)
      if (msg.type === 'response.text.delta' ||
          msg.type === 'response.output_text.delta' ||
          msg.type === 'response.audio_transcript.delta') {
        const delta = msg.delta || msg.text || '';
        if (delta) {
          // On first delta, notify that response has started (show typing indicator)
          if (!hasSeenFirstDelta) {
            hasSeenFirstDelta = true;
            callbacks.onAssistantResponseStarted?.();
          }

          callbacks.onAssistantTextDelta?.(delta);
        }
      }
      if (msg.type === 'response.text.done' ||
          msg.type === 'response.output_text.done' ||
          msg.type === 'response.audio_transcript.done') {
        hasSeenFirstDelta = false; // Reset for next response
        callbacks.onAssistantTextDone?.();
      }

      // Response output item completion (contains full text)
      if (msg.type === 'response.output_item.done') {
        // Extract text from completed item if available
        if (msg.item?.content) {
          for (const content of msg.item.content) {
            if (content.type === 'text' && content.text) {
              // DON'T call onAssistantTextDelta here - we've already accumulated deltas
              // Just signal completion
              callbacks.onAssistantTextDone?.();
            }
          }
        }
      }

      // Pearl response lifecycle events (for audio-only mode transcription)
      if (msg.type === 'response.created') {
        console.log('[Realtime] 🎙️ Pearl response started (response.created)');
        callbacks.onAssistantResponseCreated?.();
      }
      if (msg.type === 'response.done') {
        console.log('[Realtime] ✅ Pearl response complete (response.done)');
        callbacks.onAssistantResponseComplete?.();
      }

      // Speech detection events (for barge-in)
      if (msg.type === 'input_audio_buffer.speech_started') {
        callbacks.onSpeechStarted?.();
      }
      if (msg.type === 'input_audio_buffer.speech_stopped') {
        callbacks.onSpeechStopped?.();
      }

      // Session events
      if (msg.type === 'session.created') {
        // Session created
      }

      if (msg.type === 'session.updated') {
        // Session updated
      }

      // Error events
      if (msg.type === 'error') {
        console.error('[Realtime] ❌ ERROR event received');
        console.error('[Realtime] Full error object:', JSON.stringify(msg, null, 2));
        if (msg.error) {
          console.error('[Realtime] Error type:', msg.error.type);
          console.error('[Realtime] Error code:', msg.error.code);
          console.error('[Realtime] Error message:', msg.error.message);
          console.error('[Realtime] Error param:', msg.error.param);
        } else {
          console.error('[Realtime] Error object is empty or undefined');
        }
        // Notify callback if error is critical
        if (msg.error?.type === 'invalid_request_error') {
          callbacks.onError(new Error(`OpenAI API Error: ${msg.error.message || 'Unknown error'}`));
        }
      }

    } catch (err) {
      // Ignore non-JSON frames (control messages)
    }
  };

  // 5. Mic capture (NO sampleRate - let WebRTC negotiate 48kHz Opus)
  // Docs: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  // Docs: https://webrtchacks.com (explains why NOT to set sampleRate)
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // NO sampleRate - WebRTC uses 48kHz Opus automatically
    },
  });

  mic.getTracks().forEach((track) => pc.addTrack(track, mic));
  console.log('[Realtime] 🎤 Mic track added to peer connection');

  // 6. Create SDP offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log('[Realtime] 📤 SDP offer created, exchanging with OpenAI...');

  // 7. Connect to OpenAI Realtime via WebRTC (Ephemeral Token approach)
  // Docs: https://platform.openai.com/docs/guides/realtime-webrtc
  // Using ephemeral token from /v1/realtime/client_secrets endpoint
  // POST to /v1/realtime/calls with ephemeral token for WebRTC SDP exchange
  console.log('[Realtime] 📡 Calling https://api.openai.com/v1/realtime/calls...');
  const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/sdp',
    },
    body: offer.sdp,
  });

  console.log('[Realtime] 📥 SDP response status:', sdpResponse.status, sdpResponse.statusText);

  if (!sdpResponse.ok) {
    const errorText = await sdpResponse.text();
    console.error('[Realtime] ❌ SDP exchange failed:', {
      status: sdpResponse.status,
      statusText: sdpResponse.statusText,
      error: errorText,
      errorLength: errorText.length,
    });
    throw new Error(`Failed to connect to Realtime API: ${errorText}`);
  }

  const answerSdp = await sdpResponse.text();
  console.log('[Realtime] ✅ Got SDP answer, setting remote description...');
  await pc.setRemoteDescription({
    type: 'answer',
    sdp: answerSdp,
  } as RTCSessionDescriptionInit);
  console.log('[Realtime] ✅ WebRTC connection established!');

  // Helper function to safely send data through the channel
  const safeSend = (data: any, retryCount = 0): boolean => {
    try {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        if (retryCount < 3) {
          console.warn(`[Realtime] ⚠️ Data channel not ready (state: ${dataChannel?.readyState || 'null'}). Retry ${retryCount + 1}/3 in ${500 * (retryCount + 1)}ms...`);
          setTimeout(() => {
            safeSend(data, retryCount + 1);
          }, 500 * (retryCount + 1));
        } else {
          console.error('[Realtime] ❌ Data channel not ready after 3 retries. Message dropped.');
        }
        return false;
      }
      dataChannel.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[Realtime] ❌ Error sending data through channel:', error);
      if (retryCount < 3) {
        setTimeout(() => {
          safeSend(data, retryCount + 1);
        }, 500 * (retryCount + 1));
      }
      return false;
    }
  };

  // 8. Send session.update to configure VAD, transcription, and instructions
  // Docs: https://platform.openai.com/docs/api-reference/realtime-client-events/session/update
  dataChannel.onopen = () => {
    console.log('[Realtime] ✅ Data channel opened, sending session.update...');

    const sessionConfig = {
      type: 'session.update',
      session: {
        type: 'realtime',
        output_modalities: ['audio'], // Audio mode with transcription enabled below
        instructions: config?.instructions || 'Speak only English. Ask one question at a time.',
        audio: {
          input: {
            transcription: {
              model: 'whisper-1',
              language: 'en',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.85,
              prefix_padding_ms: 500,
              silence_duration_ms: 2000,
              create_response: true,
            },
            format: {
              type: 'audio/pcm',
              rate: 24000,
            },
          },
          output: {
            voice: 'shimmer',
            format: {
              type: 'audio/pcm',
              rate: 24000,
            },
            transcription: {
              model: 'whisper-1', // Enable audio transcription for real-time text
            },
          },
        },
      },
    };

    // Defensive check: Ensure output_modalities is audio-only
    const expectedModalities = ['audio'];
    if (JSON.stringify(sessionConfig.session.output_modalities) !== JSON.stringify(expectedModalities)) {
      console.error('[Realtime] ❌ Invalid output_modalities detected:', sessionConfig.session.output_modalities);
      console.error('[Realtime] ⚠️ Forcing to ["audio"] before sending');
      sessionConfig.session.output_modalities = expectedModalities;
    }

    console.log('[Realtime] 📤 Sending session.update:', JSON.stringify(sessionConfig, null, 2));
    safeSend(sessionConfig);
    callbacks.onConnected?.();
  };

  // 9. Reconnection logic (handle ICE failures)
  const reconnect = async (): Promise<RealtimeHandles> => {
    pc.close();
    // Recursively call startRealtime to get new session
    // NOTE: Caller should fetch a new ephemeral token for reconnection
    return startRealtime(callbacks, apiKey, config);
  };

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
      console.error('[Realtime] WebRTC connection lost');
      callbacks.onError(new Error('WebRTC connection lost'));
      // Auto-reconnect
      reconnect().catch(err => {
        console.error('[Realtime] Reconnect failed:', err);
        callbacks.onError(err);
      });
    }
  };

  // 10. Cleanup function
  const stop = () => {
    mic.getTracks().forEach(track => track.stop());
    dataChannel.close();
    pc.close();
  };

  // 11. Update instructions dynamically (session.update)
  // Used for hint freshness and do-not-ask filtering
  const updateInstructions = (instructions: string) => {
    const updateMessage = {
      type: 'session.update',
      session: {
        instructions: instructions,
      },
    };

    if (!safeSend(updateMessage)) {
      console.error('[Realtime] ❌ Failed to update instructions');
    }
  };

  // 12. Send text message to conversation
  // Docs: https://platform.openai.com/docs/guides/realtime-webrtc#conversation-item-create
  const sendTextMessage = (text: string) => {
    const textMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    };

    if (safeSend(textMessage)) {
      // Trigger response generation
      const responseCreate = {
        type: 'response.create',
      };
      safeSend(responseCreate);
    } else {
      console.error('[Realtime] ❌ Failed to send text message');
    }
  };

  // 13. Trigger Pearl to speak first (no user message needed)
  const triggerPearlResponse = () => {
    const responseCreate = {
      type: 'response.create',
    };

    safeSend(responseCreate);
  };

  // 14. Toggle microphone on/off
  const toggleMic = (enabled: boolean) => {
    mic.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  };

  return { pc, mic, dataChannel, stop, reconnect, updateInstructions, sendTextMessage, triggerPearlResponse, toggleMic };
}
