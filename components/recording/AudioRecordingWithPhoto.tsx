"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

type AudioRecordingWithPhotoProps = {
  photoDataURL: string | null;
  onComplete: (audioBlob: Blob, duration: number, data?: {
    transcription: string;
    title: string;
    lessonOptions: {
      practical: string;
      emotional: string;
      character: string;
    };
  }) => void;
  onCancel: () => void;
};

export function AudioRecordingWithPhoto({
  photoDataURL,
  onComplete,
  onCancel
}: AudioRecordingWithPhotoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingState, setRecordingState] = useState<'preparing' | 'recording' | 'paused' | 'processing'>('preparing');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: audioChunksRef.current[0]?.type || 'audio/webm'
        });

        // Start processing
        setIsProcessing(true);
        setRecordingState('processing');

        try {
          // Call transcribe API
          const formData = new FormData();
          formData.append('audio', audioBlob);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            // Pass all AI-generated data to parent
            onComplete(audioBlob, duration, {
              transcription: data.transcription || '',
              title: data.title || 'My Memory',
              lessonOptions: data.lessonOptions || {
                practical: "Every experience teaches something if you're willing to learn from it",
                emotional: "The heart remembers what the mind forgets",
                character: "Who you become matters more than what you achieve",
              }
            });
          } else {
            // Fallback if transcription fails
            console.error('Transcription failed:', response.statusText);
            onComplete(audioBlob, duration);
          }
        } catch (error) {
          console.error('Processing error:', error);
          // Fallback on error
          onComplete(audioBlob, duration);
        } finally {
          setIsProcessing(false);
        }
      };

      // Setup audio context for waveform
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start recording
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingState('recording');
      startTimeRef.current = Date.now();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000;
        setDuration(elapsed);

        // Auto-stop at 120 seconds (2 minutes)
        if (elapsed >= 120) {
          handleStopAndSave();
        }
      }, 200);

      // Start waveform visualization
      drawWaveform();

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access is needed to record your story.');
      onCancel();
    }
  };

  const drawWaveform = () => {
    if (!waveformCanvasRef.current || !analyserRef.current) return;

    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Continue drawing even when paused, just check if recording
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        return;
      }

      analyser.getByteTimeDomainData(dataArray);

      // Set canvas size accounting for device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw waveform (or flat line if paused)
      ctx.strokeStyle = isPaused ? '#9CA3AF' : '#2563EB';
      ctx.lineWidth = 2;
      ctx.beginPath();

      if (isPaused) {
        // Draw flat line when paused
        ctx.moveTo(0, rect.height / 2);
        ctx.lineTo(rect.width, rect.height / 2);
      } else {
        // Draw waveform when recording
        const sliceWidth = rect.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; // 0-2 range
          const y = (v * rect.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
      }

      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setRecordingState('paused');
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      // Waveform continues animating but shows flat line
    } else if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setRecordingState('recording');
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      // Waveform continues automatically, will show active waveform again
    }
  };

  const handleStopAndSave = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  };

  const cleanup = () => {
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (duration / 120) * 100);
  const isNearEnd = duration >= 90;
  const isVeryNearEnd = duration >= 110;

  return (
    <section className="h-screen bg-black flex flex-col">
      {/* Top 40% Photo */}
      <div className="h-[40%] relative">
        {photoDataURL ? (
          <img
            src={photoDataURL}
            className="w-full h-full object-contain bg-black"
            alt="Selected Photo"
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-white/50">No photo selected</p>
          </div>
        )}
      </div>

      {/* Bottom 60% Recording UI or Processing Spinner */}
      {isProcessing ? (
        <div className="h-[60%] bg-white rounded-t-3xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-lg text-gray-900 font-medium">Processing your memory...</p>
          <p className="text-sm text-gray-600 mt-2">Creating transcription and suggestions</p>
        </div>
      ) : (
        <div className="h-[60%] bg-white rounded-t-3xl p-6 pt-5 flex flex-col">
          {/* Timer and state */}
          <div className="text-center">
            <div className={`text-6xl font-light tabular-nums leading-none ${isVeryNearEnd ? 'text-red-600' : ''}`}>
              {formatTime(duration)}
            </div>
            <div className="text-sm text-gray-500 uppercase tracking-wider mt-2">
              {recordingState === 'preparing' && 'Preparing…'}
              {recordingState === 'recording' && 'Recording'}
              {recordingState === 'paused' && 'Paused'}
            </div>
            {isNearEnd && (
              <div className="text-[14px] text-red-600 mt-1">
                {Math.ceil(120 - duration)} seconds left
              </div>
            )}
          </div>

        {/* Progress (2 min max) */}
        <div className="mt-5 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-3 bg-blue-600 rounded-full transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Waveform */}
        <canvas
          ref={waveformCanvasRef}
          className="mt-4 h-20 w-full rounded-md bg-gray-50 border border-gray-200"
        />

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={handlePauseResume}
            className="h-28 w-28 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-95 transition outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-14 h-14" /> : <Pause className="w-14 h-14" />}
          </button>
        </div>

        {/* Helper prompts */}
        <div className="mt-5 text-center text-gray-700 text-[20px] leading-relaxed">
          <p>Who's in this photo? When was it? Why is it special?</p>
        </div>

          {/* Stop & Save - Centered */}
          <div className="mt-auto pt-4 flex justify-center">
            <Button
              onClick={handleStopAndSave}
              className="w-full max-w-sm h-[60px] bg-blue-600 text-white rounded-xl text-[18px] font-medium hover:bg-blue-700 shadow-lg"
            >
              Stop & Save
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
