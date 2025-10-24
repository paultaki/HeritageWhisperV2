/**
 * User-Only Audio Recorder (Mic Only)
 *
 * Records ONLY the user's microphone audio during Pearl interviews.
 * This audio is saved with the story for playback, excluding Pearl's voice.
 *
 * Format:
 * - Source: WebM Opus (standard for WebRTC at 48kHz)
 * - Playback: Works in Chrome/Firefox, Safari may need MP3/AAC transcode
 *
 * Usage:
 * 1. Start AFTER microphone stream is available
 * 2. Upload WebM blob to Supabase Storage for archival
 * 3. This runs in parallel with mixedRecorder for dual recording
 *
 * Safari Compatibility:
 * - Safari has inconsistent WebM Opus support in <audio> tag
 * - Solution: Keep WebM as source, transcode to MP3/AAC server-side for playback
 * - Docs: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_codecs
 */
export function startUserOnlyRecorder(args: {
  micStream: MediaStream;
  onStop: (blob: Blob) => void;
}) {
  console.log('[UserOnlyRecorder] Starting user-only recording...');

  // Record directly from mic stream (no mixing needed)
  // This captures ONLY the user's voice, not Pearl's responses
  const mimeType = "audio/webm;codecs=opus";
  const rec = new MediaRecorder(args.micStream, { mimeType });

  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  rec.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    console.log('[UserOnlyRecorder] Stopped. Size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
    args.onStop(blob);
  };

  rec.start(1000); // 1-second timeslices
  console.log('[UserOnlyRecorder] Recording started (WebM Opus, 48kHz, user voice only)');

  return { stop: () => rec.stop() };
}