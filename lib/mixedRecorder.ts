// lib/mixedRecorder.ts
export function startMixedRecorder(args: {
  micStream: MediaStream;
  botStream: MediaStream;
  onStop: (blob: Blob) => void;
}) {
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();

  const micSrc = ctx.createMediaStreamSource(args.micStream);
  const botSrc = ctx.createMediaStreamSource(args.botStream);

  micSrc.connect(dest);
  botSrc.connect(dest);

  const mimeType = "audio/webm;codecs=opus";
  const rec = new MediaRecorder(dest.stream, { mimeType });

  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    args.onStop(blob);
    ctx.close();
  };

  rec.start();
  return { stop: () => rec.stop() };
}
