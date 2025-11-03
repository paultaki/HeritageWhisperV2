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
  console.log('[Realtime] Starting session with direct API key...');

  // 2. Create WebRTC peer connection
  // Docs: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
  const pc = new RTCPeerConnection();

  // 3. Assistant audio output (receive track)
  pc.ontrack = (event) => {
    console.log('[Realtime] 🔊 Received assistant audio track');
    const stream = event.streams[0];
    console.log('[Realtime] Audio stream tracks:', stream.getTracks().map(t => ({
      kind: t.kind,
      enabled: t.enabled,
      readyState: t.readyState
    })));
    callbacks.onAssistantAudio(stream);
  };

  // 4. Data channel for events (transcripts, text, etc.)
  const dataChannel = pc.createDataChannel('oai-events');

  // Track if we've seen the first text delta for this response
  let hasSeenFirstDelta = false;

  dataChannel.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      // DEBUG: Log all event types to see what we're receiving
      if (msg.type && !msg.type.includes('audio.delta')) {
        console.log('[Realtime] Event:', msg.type, msg);
      }

      // DEBUG: Specifically log any conversation or input events
      if (msg.type && (msg.type.includes('conversation') || msg.type.includes('input_audio'))) {
        console.log('[Realtime] 🎤 User audio event:', msg.type, msg);
      }

      // User speech transcript events (CANONICAL NAMES)
      if (msg.type === 'conversation.item.input_audio_transcription.delta') {
        console.log('[Realtime] 📝 Transcript delta:', msg.delta);
        callbacks.onTranscriptDelta(msg.delta || '');
      }
      if (msg.type === 'conversation.item.input_audio_transcription.completed') {
        console.log('[Realtime] ✅ Transcript completed:', msg.transcript);
        callbacks.onTranscriptFinal(msg.transcript || '');
      }
      if (msg.type === 'conversation.item.input_audio_transcription.failed') {
        console.error('[Realtime] ❌ Transcription failed:', msg.error);
        callbacks.onError(new Error('Transcription failed: ' + msg.error?.message));
      }

      // conversation.item.created - user audio committed
      if (msg.type === 'conversation.item.created') {
        console.log('[Realtime] 🎤 Conversation item created:', msg.item);
        // Check if this is a user audio item that needs transcription
        if (msg.item?.type === 'message' && msg.item?.role === 'user') {
          console.log('[Realtime] User message committed, waiting for transcription...');
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
          console.log('[Realtime] Assistant text delta:', delta);

          // On first delta, notify that response has started (show typing indicator)
          if (!hasSeenFirstDelta) {
            console.log('[Realtime] First text delta - response started');
            hasSeenFirstDelta = true;
            callbacks.onAssistantResponseStarted?.();
          }

          callbacks.onAssistantTextDelta?.(delta);
        }
      }
      if (msg.type === 'response.text.done' ||
          msg.type === 'response.output_text.done' ||
          msg.type === 'response.audio_transcript.done') {
        console.log('[Realtime] Assistant text done');
        hasSeenFirstDelta = false; // Reset for next response
        callbacks.onAssistantTextDone?.();
      }

      // Response output item completion (contains full text)
      if (msg.type === 'response.output_item.done') {
        console.log('[Realtime] Output item done:', msg.item);
        // Extract text from completed item if available
        if (msg.item?.content) {
          for (const content of msg.item.content) {
            if (content.type === 'text' && content.text) {
              console.log('[Realtime] ✅ Assistant said (full text):', content.text);
              // DON'T call onAssistantTextDelta here - we've already accumulated deltas
              // Just signal completion
              callbacks.onAssistantTextDone?.();
            }
          }
        }
      }

      // Speech detection events (for barge-in)
      if (msg.type === 'input_audio_buffer.speech_started') {
        console.log('[Realtime] User started speaking');
        callbacks.onSpeechStarted?.();
      }
      if (msg.type === 'input_audio_buffer.speech_stopped') {
        console.log('[Realtime] User stopped speaking');
        callbacks.onSpeechStopped?.();
      }

      // Session events
      if (msg.type === 'session.created') {
        console.log('[Realtime] 📋 Session created:', msg.session);
        console.log('[Realtime] 🔍 Initial transcription config:', msg.session?.input_audio_transcription);
      }

      if (msg.type === 'session.updated') {
        console.log('[Realtime] ✅ Session updated:', msg.session);
        console.log('[Realtime] 🔍 Transcription config:', msg.session?.input_audio_transcription);
        console.log('[Realtime] 🔍 Modalities:', msg.session?.modalities);
        console.log('[Realtime] 🔍 Turn detection:', msg.session?.turn_detection);
        console.log('[Realtime] 🔍 Temperature:', msg.session?.temperature);
      }

      // Error events
      if (msg.type === 'error') {
        console.error('[Realtime] ❌ ERROR:', msg.error);
        if (msg.error?.type) {
          console.error('[Realtime] Error type:', msg.error.type);
          console.error('[Realtime] Error message:', msg.error.message);
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

  // 6. Create SDP offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // 7. Connect to OpenAI Realtime via WebRTC (Direct API Key approach)
  // Docs: https://platform.openai.com/docs/guides/realtime-webrtc
  // Using direct API key = 30-minute session TTL
  console.log('[Realtime] Connecting to OpenAI WebRTC endpoint...');
  const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/sdp',
    },
    body: offer.sdp,
  });

  console.log('[Realtime] SDP response status:', sdpResponse.status, sdpResponse.statusText);

  if (!sdpResponse.ok) {
    const errorText = await sdpResponse.text();
    console.error('[Realtime] SDP exchange failed:', {
      status: sdpResponse.status,
      statusText: sdpResponse.statusText,
      error: errorText,
      errorLength: errorText.length,
    });
    throw new Error(`Failed to connect to Realtime API: ${errorText}`);
  }

  const answerSdp = await sdpResponse.text();
  await pc.setRemoteDescription({
    type: 'answer',
    sdp: answerSdp,
  } as RTCSessionDescriptionInit);

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

  // 8. Send session.update (REQUIRED for transcription)
  // Docs: https://platform.openai.com/docs/guides/realtime-webrtc#session-configuration
  // Why VAD params: 300ms silence/prefix = snappy turns without cutting off speech
  dataChannel.onopen = () => {
    console.log('[Realtime] DataChannel open, sending session.update');

    const sessionConfig: any = {
      type: 'session.update',
      session: {
        // Enable input transcription (whisper-1 required to receive transcript events)
        input_audio_transcription: {
          model: 'whisper-1',
        },
        // Server VAD with longer silence threshold for storytelling
        // Docs: https://platform.openai.com/docs/guides/realtime-webrtc#vad
        turn_detection: {
          type: 'server_vad',
          threshold: 0.7,  // Higher threshold = less sensitive to ambient noise (was 0.5)
          prefix_padding_ms: 300,  // Include 300ms before speech starts
          silence_duration_ms: 2000, // Wait 2 seconds of silence before ending turn (increased for natural pauses)
        },
        // Allow longer responses for natural conversation flow (1200 tokens ≈ 15-18 sentences)
        max_response_output_tokens: 1200,
      },
    };

    // Add optional configuration if provided
    if (config) {
      if (config.instructions) {
        sessionConfig.session.instructions = config.instructions;
        console.log('[Realtime] Setting instructions:', config.instructions.substring(0, 100) + '...');
      }
      if (config.modalities) {
        sessionConfig.session.modalities = config.modalities;
        console.log('[Realtime] Setting modalities:', config.modalities);
      }
      if (config.voice) {
        sessionConfig.session.voice = config.voice;
        console.log('[Realtime] Setting voice:', config.voice);
      }
      if (config.temperature !== undefined) {
        sessionConfig.session.temperature = config.temperature;
        console.log('[Realtime] Setting temperature:', config.temperature);
      }
    }

    safeSend(sessionConfig);
    callbacks.onConnected?.();
  };

  // 9. Reconnection logic (handle ICE failures)
  const reconnect = async (): Promise<RealtimeHandles> => {
    console.log('[Realtime] Reconnecting...');
    pc.close();
    // Recursively call startRealtime to get new session (with same API key)
    return startRealtime(callbacks, apiKey);
  };

  pc.oniceconnectionstatechange = () => {
    console.log('[Realtime] ICE state:', pc.iceConnectionState);

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
    console.log('[Realtime] Stopping session');
    mic.getTracks().forEach(track => track.stop());
    dataChannel.close();
    pc.close();
  };

  // 11. Update instructions dynamically (session.update)
  // Used for hint freshness and do-not-ask filtering
  const updateInstructions = (instructions: string) => {
    console.log('[Realtime] Updating instructions via session.update...');
    console.log('[Realtime] New instructions preview:', instructions.substring(0, 150) + '...');

    const updateMessage = {
      type: 'session.update',
      session: {
        instructions: instructions,
      },
    };

    if (safeSend(updateMessage)) {
      console.log('[Realtime] ✅ Instructions updated');
    } else {
      console.error('[Realtime] ❌ Failed to update instructions');
    }
  };

  // 12. Send text message to conversation
  // Docs: https://platform.openai.com/docs/guides/realtime-webrtc#conversation-item-create
  const sendTextMessage = (text: string) => {
    console.log('[Realtime] Sending text message:', text);

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
      console.log('[Realtime] ✅ Text message sent');

      // Trigger response generation
      const responseCreate = {
        type: 'response.create',
      };
      if (safeSend(responseCreate)) {
        console.log('[Realtime] ✅ Response generation triggered');
      }
    } else {
      console.error('[Realtime] ❌ Failed to send text message');
    }
  };

  // 13. Trigger Pearl to speak first (no user message needed)
  const triggerPearlResponse = () => {
    console.log('[Realtime] Triggering Pearl to speak first...');

    const responseCreate = {
      type: 'response.create',
    };

    if (safeSend(responseCreate)) {
      console.log('[Realtime] ✅ Pearl response triggered');
    } else {
      console.log('[Realtime] ⚠️ Pearl response trigger queued for retry');
    }
  };

  // 14. Toggle microphone on/off
  const toggleMic = (enabled: boolean) => {
    console.log('[Realtime] Toggling mic:', enabled ? 'ON' : 'OFF');
    mic.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  };

  return { pc, mic, dataChannel, stop, reconnect, updateInstructions, sendTextMessage, triggerPearlResponse, toggleMic };
}
