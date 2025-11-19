"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Edit2, ZoomIn, ZoomOut } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";

type AudioRecordingWithPhotoProps = {
  photoDataURL: string | null;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  onComplete: (audioBlob: Blob, duration: number, updatedPhotoTransform: { zoom: number; position: { x: number; y: number } }, data?: {
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
  photoTransform: initialPhotoTransform,
  onComplete,
  onCancel
}: AudioRecordingWithPhotoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingState, setRecordingState] = useState<'preparing' | 'recording' | 'paused' | 'processing'>('preparing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

  // Photo editing state
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoTransform, setPhotoTransform] = useState(initialPhotoTransform || { zoom: 1, position: { x: 0, y: 0 } });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const photoImageRef = useRef<HTMLImageElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('[AudioRecording] Requesting microphone with echo cancellation...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Log audio settings
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      console.log('[AudioRecording] Audio track settings:', {
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseSuppression,
        autoGainControl: settings.autoGainControl,
      });

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

          console.log('[AudioRecording] Sending audio to transcribe API, blob size:', audioBlob.size);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          console.log('[AudioRecording] Transcribe API response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('[AudioRecording] ========== TRANSCRIBE API SUCCESS ==========');
            console.log('[AudioRecording] Response data:', {
              hasTranscription: !!data.transcription,
              transcriptionLength: data.transcription?.length,
              transcriptionPreview: data.transcription?.substring(0, 100),
              title: data.title,
              hasLessonOptions: !!data.lessonOptions,
              lessonOptions: data.lessonOptions,
            });
            console.log('[AudioRecording] Full API response:', data);

            // Pass all AI-generated data to parent (including updated photo transform)
            onComplete(audioBlob, duration, photoTransform, {
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
            const errorText = await response.text();
            console.error('Transcription failed:', response.statusText, errorText);
            onComplete(audioBlob, duration, photoTransform);
          }
        } catch (error) {
          console.error('Processing error:', error);
          // Fallback on error
          onComplete(audioBlob, duration, photoTransform);
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
        if (!isPaused) {
          const elapsed = (Date.now() - startTimeRef.current - totalPausedTime) / 1000;
          setDuration(elapsed);

          // Auto-stop at 120 seconds (2 minutes)
          if (elapsed >= 120) {
            handleStopAndSave();
          }
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

      // Clear canvas with heritage background
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--hw-page-bg').trim();
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw waveform (or flat line if paused) with design system colors
      ctx.strokeStyle = isPaused
        ? getComputedStyle(document.documentElement).getPropertyValue('--hw-text-muted').trim()
        : getComputedStyle(document.documentElement).getPropertyValue('--hw-primary').trim();
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
      // Pausing
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setRecordingState('paused');
      pauseStartTimeRef.current = Date.now(); // Mark when we paused
      // Waveform continues animating but shows flat line
    } else if (mediaRecorderRef.current.state === 'paused') {
      // Resuming
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setRecordingState('recording');
      // Add the time we were paused to total paused time
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      setTotalPausedTime(prev => prev + pauseDuration);
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

  // Photo editing handlers
  const handleZoomChange = (value: number[]) => {
    setPhotoTransform(prev => ({ ...prev, zoom: value[0] }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !photoImageRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const rect = photoImageRef.current.getBoundingClientRect();
    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;

    const maxPercent = (photoTransform.zoom - 1) * 50;

    setPhotoTransform(prev => ({
      ...prev,
      position: {
        x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
        y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
      }
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !photoImageRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    const rect = photoImageRef.current.getBoundingClientRect();
    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;

    const maxPercent = (photoTransform.zoom - 1) * 50;

    setPhotoTransform(prev => ({
      ...prev,
      position: {
        x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
        y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
      }
    }));

    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const progressPercent = Math.min(100, (duration / 120) * 100);
  const isNearEnd = duration >= 90;
  const isVeryNearEnd = duration >= 110;

  return (
    <section className="h-screen bg-black flex flex-col">
      {/* Photo editing modal */}
      {isEditingPhoto && photoDataURL && (
        <div className="absolute inset-0 bg-black flex flex-col z-50">
          {/* Header with instructions */}
          <div className="flex-shrink-0 px-6 py-4 bg-black/90">
            <p className="text-white text-center text-base">
              Drag to reposition, use slider to zoom
            </p>
          </div>

          {/* 16:10 aspect ratio editing frame */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div
              className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden border-2 border-white/30"
              style={{ aspectRatio: '16/10' }}
            >
              <div
                ref={photoImageRef}
                className="absolute inset-0 touch-none select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={photoDataURL}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `scale(${photoTransform.zoom}) translate(${photoTransform.position.x}%, ${photoTransform.position.y}%)`,
                    transformOrigin: 'center center',
                  }}
                  alt="Editing"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex-shrink-0 px-8 py-6 bg-black/90">
            <div className="flex items-center gap-4 max-w-md mx-auto">
              <ZoomOut className="w-5 h-5 text-white flex-shrink-0" />
              <Slider.Root
                className="relative flex items-center select-none touch-none flex-1 h-5"
                value={[photoTransform.zoom]}
                onValueChange={handleZoomChange}
                min={1}
                max={3}
                step={0.1}
              >
                <Slider.Track className="bg-white/20 relative grow rounded-full h-[3px]">
                  <Slider.Range className="absolute bg-white rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-6 h-6 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Zoom"
                />
              </Slider.Root>
              <ZoomIn className="w-5 h-5 text-white flex-shrink-0" />
            </div>
          </div>

          {/* Done button */}
          <div className="flex-shrink-0 px-6 pb-8 pt-4">
            <Button
              onClick={() => setIsEditingPhoto(false)}
              className="w-full h-[60px] rounded-xl bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] text-white hover:shadow-2xl"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Photo section - 16:10 aspect ratio on desktop */}
      <div className="h-[40%] md:h-auto md:flex-shrink-0 bg-black flex items-center justify-center">
        {photoDataURL ? (
          <div className="relative w-full h-full md:h-auto md:w-full md:max-w-4xl md:mx-auto overflow-hidden" style={{ aspectRatio: '16/10' }}>
            <img
              src={photoDataURL}
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                transform: `scale(${photoTransform.zoom}) translate(${photoTransform.position.x}%, ${photoTransform.position.y}%)`,
                transformOrigin: 'center center',
              }}
              alt="Selected Photo"
            />

            {/* Edit Photo button - only show when not recording */}
            {!isProcessing && (
              <button
                onClick={() => setIsEditingPhoto(true)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                <Edit2 className="w-4 h-4" />
                <span className="text-sm font-medium">Edit Photo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full md:max-w-4xl bg-gray-900 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '16/10' }}>
            <p className="text-white/50">No photo selected</p>
          </div>
        )}
      </div>

      {/* Recording UI section */}
      {isProcessing ? (
        <div className="flex-1 bg-[var(--hw-surface)] rounded-t-3xl backdrop-blur-[18px] flex flex-col items-center justify-center transition-all duration-300 md:max-w-4xl md:mx-auto md:w-full px-6">
          <div
            className="w-16 h-16 md:w-20 md:h-20 border-4 border-t-transparent rounded-full animate-spin mb-6"
            style={{
              borderColor: `var(--hw-primary) transparent var(--hw-primary) transparent`
            }}
          />
          <p className="text-3xl md:text-4xl text-[var(--hw-text-primary)] font-semibold text-center">Processing your memory...</p>
          <p className="text-xl md:text-2xl text-[var(--hw-text-secondary)] mt-3 text-center">Creating transcription and suggestions</p>
        </div>
      ) : (
          <div className="flex-1 bg-[var(--hw-surface)] rounded-t-3xl backdrop-blur-[18px] p-6 md:p-12 pt-5 md:pt-8 flex flex-col relative transition-all duration-300 md:max-w-4xl md:mx-auto md:w-full">
          {/* Cancel button - top right */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)] transition-all duration-200 hover:scale-110 min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Cancel recording"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Timer and state */}
          <div className="text-center">
            <div className={`text-6xl md:text-7xl font-light tabular-nums leading-none transition-colors ${isVeryNearEnd ? 'text-[var(--hw-error)]' : 'text-[var(--hw-text-primary)]'}`}>
              {formatTime(duration)}
            </div>
            <div className="text-base md:text-lg text-[var(--hw-text-secondary)] uppercase tracking-wider mt-2 md:mt-3 font-medium">
              {recordingState === 'preparing' && 'Preparing…'}
              {recordingState === 'recording' && 'Recording'}
              {recordingState === 'paused' && 'Paused'}
            </div>
            {isNearEnd && (
              <div className="text-base text-[var(--hw-error)] mt-2 font-medium">
                {Math.ceil(120 - duration)} seconds left
              </div>
            )}
          </div>

        {/* Progress (2 min max) */}
        <div className="mt-5 md:mt-8 h-3 md:h-4 bg-[var(--hw-section-bg)] rounded-full overflow-hidden shadow-sm">
          <div
            className="h-3 md:h-4 rounded-full transition-all duration-200"
            style={{
              width: `${progressPercent}%`,
              background: 'var(--hw-primary)'
            }}
          />
        </div>

        {/* Waveform */}
        <canvas
          ref={waveformCanvasRef}
          className="mt-4 md:mt-6 h-20 md:h-32 w-full rounded-xl bg-[var(--hw-page-bg)] border border-[var(--hw-border-subtle)] shadow-sm"
        />

        {/* Controls */}
        <div className="mt-6 md:mt-8 flex items-center justify-center gap-4">
          <button
            onClick={handlePauseResume}
            className="min-h-[7rem] min-w-[7rem] md:min-h-[8rem] md:min-w-[8rem] rounded-full text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-[var(--hw-primary)] focus-visible:ring-offset-2 touch-none"
            style={{
              background: isPaused ? 'var(--hw-secondary)' : 'var(--hw-primary)'
            }}
            aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
          >
            {isPaused ? (
              <Play className="w-14 h-14 md:w-16 md:h-16" fill="white" />
            ) : (
              <Pause className="w-14 h-14 md:w-16 md:h-16" />
            )}
          </button>
        </div>

        {/* Helper prompts */}
        <div className="mt-5 md:mt-6 text-center text-[var(--hw-text-primary)] text-lg md:text-xl leading-relaxed">
          <p>Who's in this photo? When was it? Why is it special?</p>
        </div>

          {/* Stop & Save - Centered with safe spacing */}
          <div className="mt-auto pt-6 md:pt-8 flex justify-center pb-safe">
            <button
              onClick={handleStopAndSave}
              className="w-full max-w-sm min-h-[60px] md:min-h-[72px] rounded-2xl text-lg md:text-xl font-semibold text-[var(--hw-text-on-dark)] hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl focus-visible:ring-4 focus-visible:ring-[var(--hw-primary)] focus-visible:ring-offset-2 px-8 py-4"
              style={{
                background: 'var(--hw-primary)'
              }}
              aria-label="Stop recording and save"
            >
              Stop & Save
            </button>
          </div>
          </div>
        )}
      </section>
  );
}
