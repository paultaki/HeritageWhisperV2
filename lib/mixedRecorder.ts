/**
 * Mixed Audio Recorder (Mic + Assistant)
 *
 * Records combined audio from user microphone and AI assistant for playback in family book.
 *
 * Format:
 * - Source: WebM Opus (standard for WebRTC at 48kHz)
 * - Playback: Works in Chrome/Firefox, Safari may need MP3/AAC transcode
 *
 * Usage:
 * 1. Start AFTER both mic and assistant streams are available
 * 2. Connect assistant track in pc.ontrack immediately to avoid missing audio
 * 3. Upload WebM blob to Supabase Storage for archival
 *
 * Safari Compatibility:
 * - Safari has inconsistent WebM Opus support in <audio> tag
 * - Solution: Keep WebM as source, transcode to MP3/AAC server-side for playback
 * - Docs: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_codecs
 */
export function startMixedRecorder(args: {
  micStream: MediaStream;
  botStream: MediaStream;
  onStop: (blob: Blob) => void;
}) {
  console.log('[MixedRecorder] Starting...');

  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();

  // Connect mic input
  const micSrc = ctx.createMediaStreamSource(args.micStream);
  micSrc.connect(dest);

  // Connect assistant audio (must be connected IMMEDIATELY when stream available)
  const botSrc = ctx.createMediaStreamSource(args.botStream);
  botSrc.connect(dest);

  // Record as WebM Opus (48kHz - WebRTC standard)
  const mimeType = "audio/webm;codecs=opus";
  const rec = new MediaRecorder(dest.stream, { mimeType });

  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  rec.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    console.log('[MixedRecorder] Stopped. Size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
    args.onStop(blob);
    ctx.close();
  };

  rec.start(1000); // 1-second timeslices
  console.log('[MixedRecorder] Recording started (WebM Opus, 48kHz)');

  return { stop: () => rec.stop() };
}
