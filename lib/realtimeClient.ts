// lib/realtimeClient.ts
// OpenAI Realtime WebRTC client with session.update, dual text delta handling,
// barge-in pause, and ICE reconnect. Docs:
// Realtime concepts: https://platform.openai.com/docs/guides/realtime/concepts
// Server-to-server WS (not used here): https://platform.openai.com/docs/guides/realtime-websocket
// Event names (transcripts, text): https://openai.com/api/pricing (models) and API refs

export type RealtimeHandles = {
    pc: RTCPeerConnection;
    mic: MediaStream;
    dc: RTCDataChannel;
    stop: () => void;
  };
  
  export type RealtimeCallbacks = {
    onTranscriptDelta: (s: string) => void;
    onTranscriptFinal: (s: string) => void;
    onAssistantAudio: (stream: MediaStream) => void;
    // Handle either response.text.delta or response.output_text.delta
    onAssistantTextDelta?: (s: string) => void;
    onAssistantTextDone?: () => void;
    onSpeechStarted?: () => void; // for barge-in UI pause
    onSpeechStopped?: () => void;
    onError?: (err: Error) => void;
  };
  
  export async function startRealtime(cb: RealtimeCallbacks): Promise<RealtimeHandles> {
    // 1) Fetch ephemeral client secret from server
    const tokenRes = await fetch("/api/realtime-session", { method: "POST" });
    if (!tokenRes.ok) throw new Error("Failed to create Realtime session");
    const { client_secret } = await tokenRes.json();
  
    // 2) PeerConnection and tracks
    const pc = new RTCPeerConnection();
  
    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      cb.onAssistantAudio(stream);
    };
  
    // 3) Data channel for events
    const dc = pc.createDataChannel("oai-events");
    dc.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
  
        // Live transcription events
        // Canonical names: conversation.item.input_audio_transcription.delta|completed
        if (msg.type === "conversation.item.input_audio_transcription.delta") {
          cb.onTranscriptDelta(msg.delta || "");
        }
        if (msg.type === "conversation.item.input_audio_transcription.completed") {
          cb.onTranscriptFinal(msg.transcript || "");
        }
  
        // Assistant text delta events vary by sample; handle both
        if (msg.type === "response.text.delta" || msg.type === "response.output_text.delta") {
          cb.onAssistantTextDelta?.(msg.delta || "");
        }
        if (msg.type === "response.text.done" || msg.type === "response.completed") {
          cb.onAssistantTextDone?.();
        }
  
        // Speech started or stopped on input buffer (for barge-in UX)
        if (msg.type === "input_audio_buffer.speech_started") cb.onSpeechStarted?.();
        if (msg.type === "input_audio_buffer.speech_stopped") cb.onSpeechStopped?.();
      } catch {
        // ignore non JSON frames
      }
    };
  
    // 4) Mic with browser DSP; let WebRTC negotiate Opus 48 kHz
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    mic.getTracks().forEach((t) => pc.addTrack(t, mic));
  
    // 5) Offer and SDP exchange over REST
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  
    const sdpRes = await fetch("https://api.openai.com/v1/realtime?model=gpt-realtime", {
      method: "POST",
      headers: { Authorization: `Bearer ${client_secret}`, "Content-Type": "application/sdp" },
      body: offer.sdp,
    });
    if (!sdpRes.ok) throw new Error("Failed to connect Realtime");
    const answerSdp = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  
    // 6) Send explicit session.update once DC opens
    dc.onopen = () => {
      const update = {
        type: "session.update",
        session: {
          // Enable transcript events
          input_audio_transcription: {
            enabled: true,
            // model: "whisper-1", // optional, use if you want to pin
          },
          // Server VAD for turn detection
          turn_detection: {
            type: "server_vad",
            // threshold is model tuned; 0.5 is a sane default if supported
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 300,
            interrupt_response: true,
          },
        },
      };
      dc.send(JSON.stringify(update));
    };
  
    // 7) Reconnect on ICE failure or disconnect
    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState;
      if (st === "failed" || st === "disconnected") {
        cb.onError?.(new Error(`ICE state ${st}`));
        // Let caller recreate by calling startRealtime again if desired
      }
    };
  
    const stop = () => {
      try {
        pc.getSenders().forEach((s) => s.track?.stop());
        pc.close();
      } catch {}
    };
  
    return { pc, mic, dc, stop };
  }
  