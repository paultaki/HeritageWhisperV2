// app/realtime-demo/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { startRealtime, RealtimeHandles } from "@/lib/realtimeClient";
import { startMixedRecorder } from "@/lib/mixedRecorder";

export default function RealtimeDemo() {
  const [running, setRunning] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [provisional, setProvisional] = useState("");
  const [finals, setFinals] = useState<string[]>([]);
  const [assistantText, setAssistantText] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handles = useRef<RealtimeHandles | null>(null);
  const botAudioRef = useRef<HTMLAudioElement | null>(null);
  const recorder = useRef<{ stop: () => void } | null>(null);
  const botStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    botAudioRef.current = new Audio();
    botAudioRef.current.autoplay = true;
  }, []);

  async function onStart() {
    setDownloadUrl(null);
    setAssistantText("");
    setFinals([]);
    setProvisional("");

    const h = await startRealtime({
      onTranscriptDelta: (s) => setProvisional(s),
      onTranscriptFinal: (s) => {
        if (s.trim()) setFinals((arr) => [...arr, s]);
        setProvisional("");
      },
      onAssistantAudio: (stream) => {
        botStreamRef.current = stream;
        if (voiceOn && botAudioRef.current) {
          botAudioRef.current.srcObject = stream;
          void botAudioRef.current.play().catch(() => {});
        }
      },
      onAssistantTextDelta: (d) => setAssistantText((t) => t + d),
      onAssistantTextDone: () => setAssistantText((t) => t + "\n"),
    });

    handles.current = h;

    // start local mixed recording
    if (h.mic && botStreamRef.current) {
      recorder.current = startMixedRecorder({
        micStream: h.mic,
        botStream: botStreamRef.current,
        onStop: (blob) => {
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          // upload blob to your storage here if desired
        },
      });
    }

    setRunning(true);
  }

  function onStop() {
    recorder.current?.stop();
    handles.current?.stop();
    setRunning(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Realtime voice chat demo</h1>

      <div className="flex items-center gap-4">
        {!running ? (
          <button
            onClick={onStart}
            className="rounded-md bg-black text-white px-4 py-2"
          >
            Start
          </button>
        ) : (
          <button
            onClick={onStop}
            className="rounded-md bg-red-600 text-white px-4 py-2"
          >
            Stop
          </button>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={voiceOn}
            onChange={(e) => setVoiceOn(e.target.checked)}
          />
          Voice replies
        </label>
      </div>

      <section className="space-y-2">
        <div className="text-sm text-gray-500">Live transcript</div>
        {provisional && (
          <div className="rounded bg-gray-100 p-3 text-gray-600">{provisional}</div>
        )}
        {finals.map((t, i) => (
          <div key={i} className="rounded bg-white p-3 shadow">{t}</div>
        ))}
      </section>

      <section className="space-y-2">
        <div className="text-sm text-gray-500">Assistant text stream</div>
        <pre className="rounded bg-gray-50 p-3 whitespace-pre-wrap">{assistantText}</pre>
      </section>

      {downloadUrl && (
        <section className="space-y-2">
          <div className="text-sm text-gray-500">Conversation recording</div>
          <a
            href={downloadUrl}
            download="conversation.webm"
            className="text-blue-600 underline"
          >
            Download the audio
          </a>
        </section>
      )}
    </main>
  );
}
