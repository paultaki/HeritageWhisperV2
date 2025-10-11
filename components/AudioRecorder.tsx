"use client";

import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { Mic, Square, Volume2 } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // in seconds
  className?: string;
  onPause?: () => void;
  onResume?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onSilenceDetected?: (duration: number) => void; // Called when silence is detected
  onSpeechDetected?: () => void; // Called when speech resumes
  silenceThreshold?: number; // Amplitude threshold for silence detection
  silenceDuration?: number; // Duration of silence needed to trigger (in ms)
  onTimeWarning?: (secondsRemaining: number) => void; // Called when approaching max duration
}

export interface AudioRecorderHandle {
  pauseRecording: () => void;
  resumeRecording: () => void;
  getCurrentRecording: () => Blob | null;
  isRecording: boolean;
  isPaused: boolean;
  getRecordingDuration: () => number; // Get current recording duration in seconds
  cleanup: () => void; // Cleanup method to stop and cleanup all resources
}

export const AudioRecorder = forwardRef<AudioRecorderHandle, AudioRecorderProps>(function AudioRecorder({
  onRecordingComplete,
  maxDuration = 120, // 2 minutes default
  className = "",
  onPause,
  onResume,
  onStart,
  onStop,
  onSilenceDetected,
  onSpeechDetected,
  silenceThreshold = 0.01,
  silenceDuration = 1000, // 1 second default
  onTimeWarning
}, ref) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>();
  const [audioLevel, setAudioLevel] = useState(0);
  const [levelBars, setLevelBars] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const finalElapsedRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>('audio/webm');
  const cancelledRef = useRef<boolean>(false); // Track if recording was cancelled

  // Silence detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const silenceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSilentRef = useRef<boolean>(false);
  const levelUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingDuration = useCallback(() => {
    if (!isRecording) return 0;
    const totalElapsed = isPaused ? pausedTimeRef.current : pausedTimeRef.current + (Date.now() - startTimeRef.current);
    return Math.floor(totalElapsed / 1000);
  }, [isRecording, isPaused]);

  // Setup silence detection and level monitoring
  const setupSilenceDetection = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Check for silence and update levels every 50ms
      silenceDetectionIntervalRef.current = setInterval(() => {
        if (!isRecording || isPaused) return;

        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average amplitude
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedAmplitude = average / 255; // Normalize to 0-1 range
        
        // Update audio level for visual indicator
        setAudioLevel(normalizedAmplitude);
        
        // Update level bars with frequency data for visual effect
        const barCount = 10;
        const newBars = [];
        const chunkSize = Math.floor(dataArray.length / barCount);
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = i * chunkSize; j < (i + 1) * chunkSize; j++) {
            sum += dataArray[j];
          }
          newBars.push(sum / chunkSize / 255);
        }
        setLevelBars(newBars);
        
        // Debug logging for silence detection (disabled to reduce console spam)
        // const currentTime = getRecordingDuration();
        // console.log(`[Silence Detection] Time: ${currentTime}s, Level: ${(normalizedAmplitude * 100).toFixed(1)}%, Threshold: ${(silenceThreshold * 100).toFixed(1)}%`);

        if (onSilenceDetected) {
          if (normalizedAmplitude < silenceThreshold) {
            // Silence detected
            if (!silenceStartRef.current) {
              silenceStartRef.current = Date.now();
              console.log(`[Silence Detection] Silence started at ${getRecordingDuration()}s`);
            } else {
              const silenceDurationMs = Date.now() - silenceStartRef.current;
              if (silenceDurationMs >= silenceDuration && !isSilentRef.current) {
                isSilentRef.current = true;
                const recordingDuration = getRecordingDuration();
                console.log(`[Silence Detection] Triggering silence callback at ${recordingDuration}s (after ${silenceDurationMs}ms of silence)`);
                onSilenceDetected(recordingDuration);
              }
            }
          } else {
            // Speech detected
            if (silenceStartRef.current) {
              const silenceDurationMs = Date.now() - silenceStartRef.current;
              console.log(`[Silence Detection] Speech resumed at ${getRecordingDuration()}s (after ${silenceDurationMs}ms of silence)`);
              silenceStartRef.current = null;
              if (isSilentRef.current) {
                isSilentRef.current = false;
                onSpeechDetected?.();
              }
            }
          }
        }
      }, 50); // Update every 50ms for smoother visualization
    } catch (error) {
      console.error('Error setting up silence detection:', error);
    }
  }, [isRecording, isPaused, silenceThreshold, silenceDuration, onSilenceDetected, onSpeechDetected, getRecordingDuration]);

  // Cleanup silence detection
  const cleanupSilenceDetection = useCallback(() => {
    if (silenceDetectionIntervalRef.current) {
      clearInterval(silenceDetectionIntervalRef.current);
      silenceDetectionIntervalRef.current = null;
    }
    if (levelUpdateIntervalRef.current) {
      clearInterval(levelUpdateIntervalRef.current);
      levelUpdateIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    silenceStartRef.current = null;
    isSilentRef.current = false;
    setAudioLevel(0);
    setLevelBars([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Prevent starting if already recording or initializing
      if (isRecording || mediaRecorderRef.current) {
        console.log('[AudioRecorder] Already recording or initializing, ignoring start request');
        return;
      }

      // Reset cancelled flag - this is a new recording
      cancelledRef.current = false;

      console.log('[AudioRecorder] Starting recording...');
      console.log('[AudioRecorder] Browser:', navigator.userAgent);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Check MediaRecorder support
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser');
      }
      
      // Request microphone permission with error handling
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          } 
        });
      } catch (error: any) {
        console.error('[AudioRecorder] getUserMedia failed:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Microphone permission denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          throw new Error('Microphone is being used by another application. Please close other apps and try again.');
        } else {
          throw new Error(`Failed to access microphone: ${error.message}`);
        }
      }
      
      console.log('[AudioRecorder] Got media stream:', stream.getAudioTracks().length, 'audio tracks');
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available in MediaStream');
      }
      if (audioTracks.length > 0) {
        console.log('[AudioRecorder] Audio track settings:', audioTracks[0].getSettings());
        console.log('[AudioRecorder] Audio track state:', audioTracks[0].readyState);
      }

      // Verify at least one track is live
      const hasLiveTrack = audioTracks.some(track => track.readyState === 'live');
      if (!hasLiveTrack) {
        throw new Error('MediaStream tracks are not in live state');
      }

      setMediaStream(stream);
      chunksRef.current = [];
      pausedTimeRef.current = 0;
      
      // Try to use webm with opus codec, but fall back to default if not supported
      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
      ];
      
      console.log('[AudioRecorder] Checking supported mime types...');
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          mimeTypeRef.current = type;
          console.log('[AudioRecorder] Using audio format:', type);
          break;
        }
      }
      
      // If no specific type is supported, let the browser choose
      if (!mimeType) {
        console.log('[AudioRecorder] No specific mime type supported, using browser default');
        mimeTypeRef.current = 'audio/webm'; // Default fallback for blob type
      }
      
      // Create MediaRecorder with or without mime type
      const mediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      
      console.log('[AudioRecorder] MediaRecorder created');
      console.log('[AudioRecorder] MediaRecorder state:', mediaRecorder.state);
      console.log('[AudioRecorder] MediaRecorder mimeType:', mediaRecorder.mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Track data collection
      let dataCollectionCount = 0;
      let totalDataSize = 0;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          dataCollectionCount++;
          totalDataSize += event.data.size;

          // Only log every 10th chunk to reduce console spam
          if (dataCollectionCount % 10 === 0 || dataCollectionCount === 1) {
            console.log(`[AudioRecorder] Chunk ${dataCollectionCount} collected, Total size: ${(totalDataSize / 1024).toFixed(1)} KB`);
          }
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('[AudioRecorder] MediaRecorder stopped');

        // Check if recording was cancelled - if so, skip processing
        if (cancelledRef.current) {
          console.log('[AudioRecorder] Recording was cancelled, skipping onRecordingComplete');
          return;
        }

        console.log('[AudioRecorder] Total chunks collected:', chunksRef.current.length);

        const totalSize = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
        console.log('[AudioRecorder] Total audio data size:', totalSize, 'bytes');

        if (chunksRef.current.length === 0) {
          console.error('[AudioRecorder] ERROR: No audio chunks collected!');
          alert('Recording failed: No audio data was captured. Please check your microphone.');
          // Clean up and return early
          stream.getTracks().forEach(track => track.stop());
          setMediaStream(undefined);
          cleanupSilenceDetection();
          setIsRecording(false);
          setIsPaused(false);
          setDuration(0);
          return;
        }

        // Use the recorded mime type or fallback
        const blobType = mediaRecorderRef.current?.mimeType || mimeTypeRef.current || 'audio/webm';
        console.log('[AudioRecorder] Creating blob with type:', blobType);

        const audioBlob = new Blob(chunksRef.current, { type: blobType });
        const finalDuration = Math.floor(finalElapsedRef.current / 1000);

        console.log('[AudioRecorder] Created audio blob - Type:', audioBlob.type, 'Size:', audioBlob.size, 'bytes');
        console.log('[AudioRecorder] Recording duration:', finalDuration, 'seconds');

        if (audioBlob.size === 0) {
          console.error('[AudioRecorder] ERROR: Audio blob is empty!');
          alert('Recording failed: The audio file is empty. Please try again.');
        }

        // Clean up stream
        stream.getTracks().forEach(track => {
          console.log('[AudioRecorder] Stopping track:', track.kind, track.label);
          track.stop();
        });
        setMediaStream(undefined);

        // Clean up silence detection
        cleanupSilenceDetection();

        // Only call completion handler if we have valid data
        if (audioBlob.size > 0) {
          onRecordingComplete(audioBlob, finalDuration);
        }
      };
      
      // Add error handler
      mediaRecorder.onerror = (event: any) => {
        console.error('[AudioRecorder] MediaRecorder error:', event);
        if (event.error) {
          console.error('[AudioRecorder] Error details:', event.error);
          alert(`Recording error: ${event.error.message || 'Unknown error occurred'}`);
        }
      };
      
      // Add state change handlers for debugging
      mediaRecorder.onstart = () => {
        console.log('[AudioRecorder] MediaRecorder started successfully');
        console.log('[AudioRecorder] State after start:', mediaRecorderRef.current?.state);

        // Setup audio monitoring AFTER MediaRecorder starts to avoid conflicts
        setupSilenceDetection(stream);
      };
      
      mediaRecorder.onpause = () => {
        console.log('[AudioRecorder] MediaRecorder paused');
      };
      
      mediaRecorder.onresume = () => {
        console.log('[AudioRecorder] MediaRecorder resumed');
      };
      
      // Start countdown before recording
      console.log('[AudioRecorder] Starting 3-2-1 countdown...');
      setCountdown(3);

      await new Promise<void>((resolve) => {
        let count = 3;
        const countdownInterval = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdown(count);
          } else {
            setCountdown(null);
            clearInterval(countdownInterval);
            resolve();
          }
        }, 1000);
      });

      // Give the MediaStream a moment to fully initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      startTimeRef.current = Date.now();

      // Start recording with larger timeslice to reduce chunks
      console.log('[AudioRecorder] Starting MediaRecorder with 1000ms timeslice...');
      console.log('[AudioRecorder] MediaRecorder config - mimeType:', mediaRecorder.mimeType, 'state:', mediaRecorder.state);

      try {
        mediaRecorder.start(1000); // Collect data every 1 second instead of 100ms
      } catch (startError: any) {
        console.error('[AudioRecorder] Failed to start with configured mimeType:', mediaRecorder.mimeType);
        console.error('[AudioRecorder] Start error:', startError);

        // Try again without any mimeType (let browser choose)
        console.log('[AudioRecorder] Attempting to recreate MediaRecorder without mimeType...');

        try {
          // Save event handlers before cleanup
          const handlers = {
            ondataavailable: mediaRecorder.ondataavailable,
            onstop: mediaRecorder.onstop,
            onerror: mediaRecorder.onerror,
            onstart: mediaRecorder.onstart,
            onpause: mediaRecorder.onpause,
            onresume: mediaRecorder.onresume
          };

          // Clean up the old mediaRecorder
          mediaRecorder.ondataavailable = null;
          mediaRecorder.onstop = null;
          mediaRecorder.onerror = null;
          mediaRecorder.onstart = null;

          // Create new MediaRecorder without any options
          const fallbackRecorder = new MediaRecorder(stream);
          console.log('[AudioRecorder] Fallback MediaRecorder created with mimeType:', fallbackRecorder.mimeType);

          // Re-attach saved event handlers
          fallbackRecorder.ondataavailable = handlers.ondataavailable;
          fallbackRecorder.onstop = handlers.onstop;
          fallbackRecorder.onerror = handlers.onerror;
          fallbackRecorder.onstart = handlers.onstart;
          fallbackRecorder.onpause = handlers.onpause;
          fallbackRecorder.onresume = handlers.onresume;

          // Replace the mediaRecorder reference
          mediaRecorderRef.current = fallbackRecorder;

          // Try to start the fallback recorder without timeslice
          console.log('[AudioRecorder] Starting fallback MediaRecorder without timeslice...');
          fallbackRecorder.start();
          console.log('[AudioRecorder] Fallback MediaRecorder started successfully');
        } catch (fallbackError: any) {
          console.error('[AudioRecorder] Fallback MediaRecorder also failed:', fallbackError);
          throw new Error(`Failed to start recording: ${fallbackError.message}. Your browser may not support audio recording.`);
        }
      }

      setIsRecording(true);
      setDuration(0);
      onStart?.();
      
      // Start timer with more frequent checks for accurate stopping
      timerRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startTimeRef.current;
        const elapsed = Math.floor(elapsedMs / 1000);
        
        // Never display a duration greater than maxDuration
        const displayDuration = Math.min(elapsed, maxDuration);
        setDuration(displayDuration);

        // Show time warnings
        const secondsRemaining = maxDuration - elapsed;
        if (secondsRemaining === 15) {
          setTimeWarning("15 seconds remaining - please wrap up your story");
          onTimeWarning?.(15);
        } else if (secondsRemaining === 10) {
          setTimeWarning("10 seconds remaining");
          onTimeWarning?.(10);
        } else if (secondsRemaining === 5) {
          setTimeWarning("5 seconds remaining");
          onTimeWarning?.(5);
        } else if (secondsRemaining > 15) {
          setTimeWarning(null);
        }

        // Auto-stop exactly at max duration
        if (elapsedMs >= maxDuration * 1000) {
          // Clear timer immediately to prevent further updates
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Capture final elapsed time (capped at maxDuration)
          finalElapsedRef.current = maxDuration * 1000;
          
          // Stop recording directly here to avoid stale closure issues
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            onStop?.();
            // Clean up will happen in onstop handler
          }
        }
      }, 100); // Check every 100ms for more accurate stopping
      
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not access microphone. Please check permissions.';
      alert(errorMessage);

      // Clean up any partially created resources
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onerror = null;
        mediaRecorderRef.current = null;
      }

      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      // Reset state
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setMediaStream(undefined);
      cleanupSilenceDetection();
    }
  }, [isRecording, maxDuration, onRecordingComplete, onStart, onStop, onSilenceDetected, setupSilenceDetection, cleanupSilenceDetection]);

  const stopRecording = useCallback(() => {
    console.log('[AudioRecorder] Stop button clicked');

    if (!mediaRecorderRef.current) {
      console.error('[AudioRecorder] No mediaRecorder found');
      return;
    }

    console.log('[AudioRecorder] Stopping recording...');
    console.log('[AudioRecorder] MediaRecorder state before stop:', mediaRecorderRef.current.state);

    if (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused") {
      // Capture final elapsed time before any state changes
      const now = Date.now();
      const totalElapsed = isPaused ? pausedTimeRef.current : pausedTimeRef.current + (now - startTimeRef.current);

      console.log('[AudioRecorder] Stop timing:', {
        now,
        startTime: startTimeRef.current,
        pausedTime: pausedTimeRef.current,
        elapsed: now - startTimeRef.current,
        totalElapsed,
        isPaused
      });

      // Cap the final elapsed time at maxDuration
      finalElapsedRef.current = Math.min(totalElapsed, maxDuration * 1000);

      const recordingDuration = Math.floor(finalElapsedRef.current / 1000);
      console.log('[AudioRecorder] Recording duration on stop:', recordingDuration, 'seconds');

      if (recordingDuration < 1) {
        console.warn('[AudioRecorder] Recording too short:', recordingDuration, 'seconds');
        alert('Please record for at least 1 second');
        return;
      }

      // Request any buffered data before stopping
      console.log('[AudioRecorder] Requesting buffered data...');
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }

      // Small delay to ensure data is flushed
      setTimeout(() => {
        console.log('[AudioRecorder] Stopping MediaRecorder...');
        mediaRecorderRef.current!.stop();
        setIsRecording(false);
        setIsPaused(false);
        onStop?.();
      }, 50);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Clean up silence detection when stopping
      cleanupSilenceDetection();
    } else {
      console.warn('[AudioRecorder] MediaRecorder is not in recording or paused state:', mediaRecorderRef.current.state);
    }
  }, [isPaused, onStop, maxDuration, cleanupSilenceDetection]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      onPause?.();
    }
  }, [isRecording, isPaused, onPause]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume the timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsedMs = pausedTimeRef.current + (Date.now() - startTimeRef.current);
        const elapsed = Math.floor(elapsedMs / 1000);
        
        // Never display a duration greater than maxDuration
        const displayDuration = Math.min(elapsed, maxDuration);
        setDuration(displayDuration);

        // Show time warnings
        const secondsRemaining = maxDuration - elapsed;
        if (secondsRemaining === 15) {
          setTimeWarning("15 seconds remaining - please wrap up your story");
          onTimeWarning?.(15);
        } else if (secondsRemaining === 10) {
          setTimeWarning("10 seconds remaining");
          onTimeWarning?.(10);
        } else if (secondsRemaining === 5) {
          setTimeWarning("5 seconds remaining");
          onTimeWarning?.(5);
        } else if (secondsRemaining > 15) {
          setTimeWarning(null);
        }

        // Auto-stop exactly at max duration
        if (elapsedMs >= maxDuration * 1000) {
          // Clear timer immediately to prevent further updates
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Capture final elapsed time (capped at maxDuration)
          finalElapsedRef.current = maxDuration * 1000;
          
          // Stop recording directly here to avoid stale closure issues
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            onStop?.();
            // Clean up will happen in onstop handler
          }
        }
      }, 100); // Check every 100ms for more accurate stopping
      
      onResume?.();
    }
  }, [isRecording, isPaused, maxDuration, onResume, onStop]);

  const getCurrentRecording = useCallback(() => {
    if (mediaRecorderRef.current && chunksRef.current.length > 0) {
      console.log('[AudioRecorder] Getting current recording...');
      console.log('[AudioRecorder] Current chunks:', chunksRef.current.length);

      // Force MediaRecorder to flush any buffered data
      if (mediaRecorderRef.current.state === 'recording') {
        console.log('[AudioRecorder] Requesting data flush...');
        mediaRecorderRef.current.requestData();
      }

      // Get the current recorded chunks and create a blob with the stored mimeType
      const blobType = mediaRecorderRef.current.mimeType || mimeTypeRef.current || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: blobType });
      console.log('[AudioRecorder] Created blob from chunks - Size:', blob.size, 'Type:', blob.type);
      return blob;
    }
    console.log('[AudioRecorder] No recording available');
    return null;
  }, []);

  // Comprehensive cleanup method
  const cleanup = useCallback(() => {
    console.log('[AudioRecorder] Cleanup called');
    cancelledRef.current = true;

    // Stop and clean up MediaRecorder
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state;
      console.log('[AudioRecorder] Cleaning up MediaRecorder, state:', state);

      // Remove event listeners to prevent callbacks
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current.onstart = null;
      mediaRecorderRef.current.onpause = null;
      mediaRecorderRef.current.onresume = null;

      if (state === 'recording' || state === 'paused') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error('[AudioRecorder] Error stopping MediaRecorder:', error);
        }
      }
      mediaRecorderRef.current = null;
    }

    // Stop and clean up MediaStream
    if (mediaStream) {
      console.log('[AudioRecorder] Stopping media stream tracks');
      mediaStream.getTracks().forEach(track => {
        console.log('[AudioRecorder] Stopping track:', track.kind, track.label);
        track.stop();
      });
      setMediaStream(undefined);
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clean up silence detection
    cleanupSilenceDetection();

    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioLevel(0);
    setLevelBars([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setTimeWarning(null);
    setCountdown(null);

    // Clear chunks
    chunksRef.current = [];

    console.log('[AudioRecorder] Cleanup complete');
  }, [mediaStream, cleanupSilenceDetection]);

  // Auto-start disabled due to React StrictMode conflicts
  // User must click the button to start recording

  // Cleanup on unmount only (not on every state change)
  useEffect(() => {
    return () => {
      console.log('[AudioRecorder] Component unmounting, calling cleanup');

      // Inline cleanup to avoid dependency issues
      cancelledRef.current = true;

      // Stop and clean up MediaRecorder
      if (mediaRecorderRef.current) {
        const state = mediaRecorderRef.current.state;
        console.log('[AudioRecorder] Cleaning up MediaRecorder, state:', state);

        // Remove event listeners to prevent callbacks
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onerror = null;
        mediaRecorderRef.current.onstart = null;
        mediaRecorderRef.current.onpause = null;
        mediaRecorderRef.current.onresume = null;

        if (state === 'recording' || state === 'paused') {
          try {
            mediaRecorderRef.current.stop();
          } catch (error) {
            console.error('[AudioRecorder] Error stopping MediaRecorder:', error);
          }
        }
        mediaRecorderRef.current = null;
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Clean up silence detection
      if (silenceDetectionIntervalRef.current) {
        clearInterval(silenceDetectionIntervalRef.current);
        silenceDetectionIntervalRef.current = null;
      }
      if (levelUpdateIntervalRef.current) {
        clearInterval(levelUpdateIntervalRef.current);
        levelUpdateIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      console.log('[AudioRecorder] Cleanup complete');
    };
  }, []); // No dependencies - only run on mount/unmount

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    pauseRecording,
    resumeRecording,
    getCurrentRecording,
    isRecording,
    isPaused,
    getRecordingDuration,
    cleanup
  }), [pauseRecording, resumeRecording, getCurrentRecording, isRecording, isPaused, getRecordingDuration, cleanup]);

  // Get level meter color based on audio level
  const getLevelColor = (level: number) => {
    if (level > 0.8) return 'bg-red-500'; // Too loud
    if (level > 0.5) return 'bg-yellow-500'; // Loud
    if (level > 0.1) return 'bg-green-500'; // Normal
    return 'bg-gray-300'; // Very quiet/silent
  };
  
  // Get status text based on audio level
  const getLevelStatus = () => {
    if (!isRecording) return '';
    if (audioLevel > 0.8) return 'Too Loud!';
    if (audioLevel > 0.3) return 'Good Volume';
    if (audioLevel > 0.05) return 'Speaking Detected';
    return 'Listening...';
  };

  return (
    <div className={`text-center ${className}`}>
      {/* Enhanced Microphone Level Indicator */}
      {isRecording && (
        <div className="mb-6 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Volume2 className={`w-5 h-5 ${audioLevel > 0.05 ? 'text-green-500' : 'text-gray-400'} transition-colors`} />
            <span className={`text-sm font-medium ${
              audioLevel > 0.8 ? 'text-red-500' :
              audioLevel > 0.3 ? 'text-green-500' :
              audioLevel > 0.05 ? 'text-yellow-500' :
              'text-gray-500'
            } transition-colors`}>
              {getLevelStatus()}
            </span>
          </div>
          
          {/* Level Bars */}
          <div className="flex justify-center items-end gap-1 h-16 mb-4">
            {levelBars.map((level, index) => {
              const height = Math.max(4, level * 64); // Min height 4px, max 64px
              const isActive = level > 0.05;
              return (
                <div
                  key={index}
                  className={`w-3 rounded-full transition-all duration-100 ${
                    level > 0.8 ? 'bg-red-500' : 
                    level > 0.5 ? 'bg-yellow-500' : 
                    level > 0.1 ? 'bg-green-500' : 
                    'bg-gray-300'
                  } ${isActive ? 'animate-pulse' : ''}`}
                  style={{
                    height: `${height}px`,
                    opacity: isActive ? 1 : 0.3,
                  }}
                  data-testid={`level-bar-${index}`}
                />
              );
            })}
          </div>
          
          {/* Main Level Meter Bar */}
          <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-100 rounded-full ${getLevelColor(audioLevel)}`}
              style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
              data-testid="audio-level-bar"
            />
          </div>
        </div>
      )}
      
      {/* Voice Visualization - Bouncing Bars */}
      {isRecording && (
        <div className="mb-8 flex items-center justify-center gap-1.5 h-24">
          {levelBars.map((level, index) => (
            <div
              key={index}
              className="w-3 bg-gradient-to-t from-coral-500 to-coral-300 rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(8, level * 80)}px`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Recording Timer */}
      <div className="mb-8">
        <div className="text-4xl font-mono text-primary" data-testid="recording-timer">
          {formatTime(duration)} / {formatTime(maxDuration)}
        </div>
        {timeWarning && (
          <div className="text-orange-600 font-semibold mt-2 animate-pulse">
            {timeWarning}
          </div>
        )}
      </div>
      
      {/* Recording Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-44 h-44 rounded-full text-2xl relative ${
            isRecording
              ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3),_0_6px_12px_rgba(0,0,0,0.2)] border-4 border-red-700 hover:from-red-600 hover:to-red-700 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
              : 'bg-gradient-to-b from-amber-500 to-rose-500 text-white shadow-[0_6px_12px_rgba(0,0,0,0.3),_inset_0_2px_4px_rgba(255,255,255,0.4)] border-4 border-amber-600 hover:from-amber-600 hover:to-rose-600 transform hover:scale-105 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:scale-95'
          } transition-all duration-150`}
          data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
        >
          <div className="flex flex-col items-center gap-2 justify-center">
            {countdown !== null ? (
              <span className="text-8xl font-bold">{countdown}</span>
            ) : isRecording ? (
              <>
                <Square className="w-20 h-20 fill-white" />
                <span className="text-2xl font-bold tracking-wide">STOP</span>
              </>
            ) : (
              <>
                <Mic className="w-24 h-24" />
                <span className="text-2xl font-bold tracking-wide">START</span>
              </>
            )}
          </div>
        </button>
      </div>

      <p className="text-muted-foreground mt-4 text-center text-2xl">
        {isRecording
          ? isPaused
            ? "Recording paused - tap to stop"
            : "Tap to stop recording"
          : "Tap to start recording"
        }
      </p>
    </div>
  );
});
